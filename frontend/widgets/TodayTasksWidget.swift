import WidgetKit
import SwiftUI

// A — 오늘 할 일. iOS v1 은 전체 모드(모든 펫 합산). systemSmall=요약/미니, systemMedium=리스트.
struct PawTodayTasksWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PawTodayTasks", provider: PawProvider()) { entry in
            TodayTasksView(entry: entry)
        }
        .configurationDisplayName("발자국 · 오늘 할 일")
        .description("지금 시간대에 해야 할 케어 체크리스트를 보여줘요")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

private struct PawCheckRow: View {
    let task: PawTask
    let palette: PawPalette
    var showPet: Bool = false
    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                if task.done {
                    RoundedRectangle(cornerRadius: 6).fill(palette.primary)
                    Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundColor(palette.white)
                } else {
                    RoundedRectangle(cornerRadius: 6).stroke(palette.track, lineWidth: 1.5)
                }
            }
            .frame(width: 18, height: 18)

            Text(task.name)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(task.done ? palette.faint : palette.ink)
                .lineLimit(1)

            if showPet {
                Text(task.petName).font(.system(size: 11)).foregroundColor(palette.faint).lineLimit(1)
            }
            Spacer(minLength: 0)
        }
    }
}

struct TodayTasksView: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetFamily) private var family
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
        if let s = snapshot, s.loggedIn {
            if s.pets.isEmpty {
                PawHint(title: "반려동물을 등록해주세요", sub: "첫 펫을 등록하면 오늘 할 일이 보여요", palette: p)
            } else {
                loaded(s, p)
            }
        } else {
            PawHint(title: "발자국", sub: "로그인하고 오늘의 케어를 시작하세요", palette: p)
        }
    }

    @ViewBuilder
    private func loaded(_ s: PawSnapshot, _ p: PawPalette) -> some View {
        let multi = s.pets.count > 1
        let solo = s.pets.count == 1 ? s.pets.first : nil
        let done = s.tasks.filter { $0.done }.count
        let total = s.tasks.count
        let picked = pawPickActiveSlot(s.tasks, Date())
        let wide = family != .systemSmall

        if total == 0 {
            VStack(alignment: .leading, spacing: 6) {
                header(p, solo: solo, multi: multi, title: "오늘 할 일", fraction: nil, done: 0, total: 0)
                Spacer(minLength: 0)
                PawHint(title: "오늘 할 일이 없어요", sub: "케어 체크리스트를 추가해보세요", palette: p)
            }
        } else if !wide && multi {
            // small + 전체 → 요약 히어로
            VStack(alignment: .leading, spacing: 4) {
                header(p, solo: nil, multi: true, title: "우리집 · 오늘", fraction: nil, done: done, total: total, hideRight: true)
                Spacer(minLength: 0)
                Text("\(done)/\(total)").font(.system(size: 32, weight: .heavy)).foregroundColor(p.primaryDark)
                Text("오늘 완료").font(.system(size: 12)).foregroundColor(p.sub)
                PawDots(done: done, total: total, palette: p).padding(.top, 4)
            }
        } else {
            let limit = wide ? 3 : 2
            let shown = Array(picked.tasks.prefix(limit))
            let more = picked.tasks.count - shown.count
            let title = wide ? (multi ? "오늘 할 일 · \(pawSlotLabel(picked.slot))" : "\(solo?.name ?? "") · \(pawSlotLabel(picked.slot)) 할 일") : "\(pawSlotLabel(picked.slot)) 할 일"
            VStack(alignment: .leading, spacing: 0) {
                header(p, solo: solo, multi: multi, title: title, fraction: "\(done)/\(total)", done: done, total: total)
                ForEach(Array(shown.enumerated()), id: \.offset) { _, t in
                    PawCheckRow(task: t, palette: p, showPet: multi).padding(.top, 8)
                }
                if more > 0 {
                    Spacer(minLength: 0)
                    HStack { Spacer(); Text("+\(more)개 더보기 ›").font(.system(size: 11, weight: .semibold)).foregroundColor(p.primaryDark) }
                }
            }
        }
    }

    @ViewBuilder
    private func header(_ p: PawPalette, solo: PawPet?, multi: Bool, title: String, fraction: String?, done: Int, total: Int, hideRight: Bool = false) -> some View {
        HStack(spacing: 8) {
            PawAvatar(palette: p)
            Text(title).font(.system(size: 13, weight: .bold)).foregroundColor(p.ink).lineLimit(1)
            Spacer(minLength: 0)
            if !hideRight {
                if let f = fraction {
                    Text(f).font(.system(size: 11, weight: .semibold)).foregroundColor(p.faint)
                }
                PawDots(done: done, total: total, palette: p)
            }
        }
    }
}

struct PawHint: View {
    let title: String
    let sub: String
    let palette: PawPalette
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.system(size: 14, weight: .bold)).foregroundColor(palette.ink)
            Text(sub).font(.system(size: 12)).foregroundColor(palette.sub)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}
