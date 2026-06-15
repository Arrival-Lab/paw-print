import WidgetKit
import SwiftUI

// D — 한눈에 보기. systemMedium 전용. 오늘 할 일 1 + 다음 일정 1 + 빠른 기록.
struct PawDashboardWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PawDashboard", provider: PawProvider()) { entry in
            DashboardView(entry: entry)
        }
        .configurationDisplayName("발자국 · 한눈에 보기")
        .description("오늘 할 일 + 다음 일정 + 빠른 기록을 한 곳에")
        .supportedFamilies([.systemMedium])
    }
}

struct DashboardView: View {
    @Environment(\.colorScheme) private var scheme
    let entry: PawEntry

    var body: some View {
        let p = PawPalette.of(scheme)
        content(p)
            .padding(14)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .pawCard(p)
            .widgetURL(link)
    }

    private var snapshot: PawSnapshot? { entry.snapshot }
    private var link: URL {
        guard let s = snapshot, s.loggedIn else { return PawLink.home }
        return s.pets.isEmpty ? PawLink.petNew : PawLink.daily
    }

    @ViewBuilder
    private func content(_ p: PawPalette) -> some View {
        if let s = snapshot, s.loggedIn, !s.pets.isEmpty {
            loaded(s, p)
        } else if let s = snapshot, s.loggedIn {
            PawHint(title: "반려동물을 등록해주세요", sub: "첫 펫을 등록하면 시작할 수 있어요", palette: p)
        } else {
            PawHint(title: "발자국", sub: "로그인하고 우리 아이 케어를 한눈에", palette: p)
        }
    }

    @ViewBuilder
    private func loaded(_ s: PawSnapshot, _ p: PawPalette) -> some View {
        let multi = s.pets.count > 1
        let solo = s.pets.count == 1 ? s.pets.first : nil
        let done = s.tasks.filter { $0.done }.count
        let total = s.tasks.count
        let picked = pawPickActiveSlot(s.tasks, Date())
        let topTask = picked.tasks.first { !$0.done } ?? picked.tasks.first
        let topEvent = s.events.first

        VStack(alignment: .leading, spacing: 8) {
            // 헤더
            HStack(spacing: 8) {
                PawAvatar(palette: p)
                Text(multi ? "우리 아이들" : (solo?.name ?? "")).font(.system(size: 13, weight: .bold)).foregroundColor(p.ink).lineLimit(1)
                Spacer(minLength: 0)
                Text("오늘 \(done)/\(total)").font(.system(size: 11, weight: .semibold)).foregroundColor(p.faint)
                PawDots(done: done, total: total, palette: p)
            }

            // 오늘 할 일 1
            if let t = topTask {
                HStack(spacing: 8) {
                    ZStack {
                        if t.done {
                            RoundedRectangle(cornerRadius: 6).fill(p.primary)
                            Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundColor(p.white)
                        } else {
                            RoundedRectangle(cornerRadius: 6).stroke(p.track, lineWidth: 1.5)
                        }
                    }.frame(width: 18, height: 18)
                    Text(t.name).font(.system(size: 13, weight: .medium)).foregroundColor(t.done ? p.faint : p.ink).lineLimit(1)
                    Text(multi ? t.petName : pawSlotLabel(t.slot)).font(.system(size: 11)).foregroundColor(p.faint).lineLimit(1)
                    Spacer(minLength: 0)
                }
            } else {
                Text("오늘 할 일이 없어요").font(.system(size: 12)).foregroundColor(p.faint)
            }

            // 다음 일정 1 (탭 → 예약 화면)
            if let e = topEvent {
                Link(destination: PawLink.appointments) {
                    HStack(spacing: 8) {
                        Image(systemName: "calendar").font(.system(size: 12)).foregroundColor(p.primaryDark)
                        Text("\(e.petName) · \(e.title)").font(.system(size: 13, weight: .semibold)).foregroundColor(p.ink).lineLimit(1)
                        Spacer(minLength: 0)
                        Text(pawDDayLabel(e.dDay))
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(e.dDay == 0 ? p.ink : p.primaryDark)
                            .padding(.horizontal, 9).padding(.vertical, 3)
                            .background(Capsule().fill(e.dDay == 0 ? p.primary : p.primaryLight))
                    }
                }
            } else {
                Text("예정된 일정이 없어요").font(.system(size: 12)).foregroundColor(p.faint)
            }

            Spacer(minLength: 0)

            // 빠른 기록 (탭 → RecordForm)
            Link(destination: PawLink.recordCreate) {
                HStack { Spacer(); Text("+ 빠른 기록").font(.system(size: 12, weight: .bold)).foregroundColor(p.primaryDark); Spacer() }
                    .frame(height: 32)
                    .background(RoundedRectangle(cornerRadius: 16).fill(p.primaryLight))
            }
        }
    }
}
