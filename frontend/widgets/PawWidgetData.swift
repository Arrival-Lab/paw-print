import SwiftUI
import WidgetKit

// MARK: - App Group / 공유 데이터
// JS 의 setWidgetData(JSON.stringify(snapshot)) 가 이 suite 의 "MyData" 키에 문자열로 저장한다.
// suite 이름은 group.{bundleId}.expowidgets 형식이어야 한다 (@bittingz/expo-widgets 규약).
let pawAppGroup = "group.com.arrivallab.pawprint.expowidgets"
let pawDataKey = "MyData"

// 딥링크 — scheme=pawprint, expo-router 경로 (그룹 (tabs) 는 URL 에서 생략).
enum PawLink {
    static let daily = URL(string: "pawprint:///daily?tab=daily-check")!
    static let appointments = URL(string: "pawprint:///appointments/all")!
    static let recordCreate = URL(string: "pawprint:///records/create")!
    static let petNew = URL(string: "pawprint:///pets/new")!
    static let home = URL(string: "pawprint:///")!
}

// MARK: - 스냅샷 모델 (frontend/features/widget/types.ts 의 WidgetSnapshot 미러)
struct PawPet: Codable {
    let id: Int
    let name: String
    let image: String?
}

struct PawTask: Codable {
    let petId: Int
    let petName: String
    let petImage: String?
    let name: String
    let done: Bool
    let slot: String
    let time: String?
}

struct PawEvent: Codable {
    let petName: String
    let title: String
    let dDay: Int
    let when: String
}

struct PawSnapshot: Codable {
    let v: Int
    let loggedIn: Bool
    let pets: [PawPet]
    let tasks: [PawTask]
    let events: [PawEvent]
}

/// App Group 에서 스냅샷 로드. 없거나 파싱 실패 시 nil.
func loadPawSnapshot() -> PawSnapshot? {
    guard
        let defaults = UserDefaults(suiteName: pawAppGroup),
        let raw = defaults.string(forKey: pawDataKey),
        let data = raw.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(PawSnapshot.self, from: data)
}

// MARK: - 시간대 슬롯 (slot.ts 미러)
let pawSlotOrder = ["morning", "lunch", "afternoon", "evening", "night", "none"]

func pawSlotLabel(_ slot: String) -> String {
    switch slot {
    case "morning": return "아침"
    case "lunch": return "점심"
    case "afternoon": return "오후"
    case "evening": return "저녁"
    case "night": return "취침전"
    default: return "시간 미지정"
    }
}

func pawCurrentSlot(_ date: Date) -> String {
    let h = Calendar.current.component(.hour, from: date)
    if h >= 5 && h < 11 { return "morning" }
    if h >= 11 && h < 14 { return "lunch" }
    if h >= 14 && h < 18 { return "afternoon" }
    if h >= 18 && h < 22 { return "evening" }
    return "night"
}

/// 현재 시간대의 할 일, 없으면 이후로 가장 가까운 비어있지 않은 슬롯.
func pawPickActiveSlot(_ tasks: [PawTask], _ now: Date) -> (slot: String, tasks: [PawTask]) {
    let cur = pawCurrentSlot(now)
    let byCurrent = tasks.filter { $0.slot == cur }
    if !byCurrent.isEmpty { return (cur, byCurrent) }
    guard let startIdx = pawSlotOrder.firstIndex(of: cur) else { return (cur, []) }
    let search = Array(pawSlotOrder[startIdx...]) + Array(pawSlotOrder[..<startIdx])
    for s in search {
        let found = tasks.filter { $0.slot == s }
        if !found.isEmpty { return (s, found) }
    }
    return (cur, [])
}

func pawDDayLabel(_ d: Int) -> String { d == 0 ? "오늘" : "D-\(d)" }

// MARK: - 팔레트 (라이트/다크) — constants/colors 미러
struct PawPalette {
    let card, ink, sub, faint, white, primary, primaryLight, primaryDark, track, done: Color

    static let light = PawPalette(
        card: Color(hex: 0xFFFFFF), ink: Color(hex: 0x1A2433), sub: Color(hex: 0x5C6577),
        faint: Color(hex: 0x8E96A8), white: Color(hex: 0xFFFFFF), primary: Color(hex: 0xF4A8B8),
        primaryLight: Color(hex: 0xFDF1F4), primaryDark: Color(hex: 0xC47E8A),
        track: Color(hex: 0xFADEE5), done: Color(hex: 0x7EAD9B)
    )
    static let dark = PawPalette(
        card: Color(hex: 0x232328), ink: Color(hex: 0xF2F2F4), sub: Color(hex: 0xA8A8AC),
        faint: Color(hex: 0x6F6F75), white: Color(hex: 0xFFFFFF), primary: Color(hex: 0xF4A8B8),
        primaryLight: Color(hex: 0x241E22), primaryDark: Color(hex: 0xDC8298),
        track: Color(hex: 0x404048), done: Color(hex: 0x7EAD9B)
    )

    static func of(_ scheme: ColorScheme) -> PawPalette { scheme == .dark ? .dark : .light }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: 1
        )
    }
}

// MARK: - 공통 뷰 조각
struct PawCardBackground: ViewModifier {
    let palette: PawPalette
    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) {
            content.containerBackground(palette.card, for: .widget)
        } else {
            content.background(palette.card)
        }
    }
}

extension View {
    func pawCard(_ palette: PawPalette) -> some View { modifier(PawCardBackground(palette: palette)) }
}

/// 진행 도트 — 채워진 도트 = 완료. total 크면 5칸 비율.
struct PawDots: View {
    let done: Int
    let total: Int
    let palette: PawPalette
    var body: some View {
        let slots = min(max(total, 0), 5)
        let filled = total <= 5 ? done : Int((Double(done) / Double(max(total, 1))) * 5.0)
        HStack(spacing: 3) {
            ForEach(0..<slots, id: \.self) { i in
                Circle().fill(i < filled ? palette.primary : palette.track).frame(width: 6, height: 6)
            }
        }
    }
}

/// 원형 아바타 — iOS 위젯 v1 은 원격 이미지 비동기 로드 제약으로 SF Symbol 폴백.
struct PawAvatar: View {
    let palette: PawPalette
    var size: CGFloat = 26
    var body: some View {
        ZStack {
            Circle().fill(palette.primaryLight)
            Image(systemName: "pawprint.fill")
                .font(.system(size: size * 0.45))
                .foregroundColor(palette.primaryDark)
        }
        .frame(width: size, height: size)
    }
}
