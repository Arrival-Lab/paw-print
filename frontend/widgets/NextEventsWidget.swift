import WidgetKit
import SwiftUI

// B — 다가오는 일정. systemSmall=큰 D-day 히어로, systemMedium=일정 3개 리스트.
struct PawNextEventsWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "PawNextEvents", provider: PawProvider()) { entry in
            NextEventsView(entry: entry)
        }
        .configurationDisplayName("발자국 · 다가오는 일정")
        .description("다음 예약·예방접종까지 남은 날을 보여줘요")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

private struct PawEventRow: View {
    let event: PawEvent
    let palette: PawPalette
    var body: some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text("\(event.petName) · \(event.title)")
                    .font(.system(size: 13, weight: .semibold)).foregroundColor(palette.ink).lineLimit(1)
                Text(event.when).font(.system(size: 11)).foregroundColor(palette.faint).lineLimit(1)
            }
            Spacer(minLength: 0)
            Text(pawDDayLabel(event.dDay))
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(event.dDay == 0 ? palette.ink : palette.primaryDark)
                .padding(.horizontal, 9).padding(.vertical, 3)
                .background(Capsule().fill(event.dDay == 0 ? palette.primary : palette.primaryLight))
        }
    }
}

struct NextEventsView: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetFamily) private var family
    let entry: PawEntry

    var body: some View {
        let p = PawPalette.of(scheme)
        content(p)
            .padding(14)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .pawCard(p)
            .widgetURL(snapshot?.loggedIn == true ? PawLink.appointments : PawLink.home)
    }

    private var snapshot: PawSnapshot? { entry.snapshot }

    private func content(_ p: PawPalette) -> some View {
        guard let s = snapshot, s.loggedIn else {
            return AnyView(PawHint(title: "발자국", sub: "로그인하면 다가오는 일정을 볼 수 있어요", palette: p))
        }
        let wide = family != .systemSmall
        if s.events.isEmpty {
            return AnyView(VStack(alignment: .leading, spacing: 6) {
                titleRow(p, wide ? "다가오는 일정" : "다음 일정")
                Spacer(minLength: 0)
                PawHint(title: "예정된 일정이 없어요", sub: "예약을 등록하면 D-day 가 보여요", palette: p)
            })
        }
        if !wide {
            let e = s.events[0]
            return AnyView(VStack(alignment: .leading, spacing: 2) {
                titleRow(p, "다음 일정")
                Spacer(minLength: 0)
                Text(pawDDayLabel(e.dDay)).font(.system(size: 34, weight: .heavy)).foregroundColor(p.primaryDark)
                Text("\(e.petName) · \(e.title)").font(.system(size: 13, weight: .semibold)).foregroundColor(p.ink).lineLimit(1)
                Text(e.when).font(.system(size: 11)).foregroundColor(p.faint).lineLimit(1)
            })
        }
        let shown = Array(s.events.prefix(3))
        return AnyView(VStack(alignment: .leading, spacing: 0) {
            titleRow(p, "다가오는 일정")
            ForEach(Array(shown.enumerated()), id: \.offset) { _, e in
                PawEventRow(event: e, palette: p).padding(.top, 8)
            }
        })
    }

    private func titleRow(_ p: PawPalette, _ title: String) -> some View {
        HStack(spacing: 8) {
            ZStack {
                Circle().fill(p.primaryLight)
                Image(systemName: "calendar").font(.system(size: 12, weight: .semibold)).foregroundColor(p.primaryDark)
            }.frame(width: 26, height: 26)
            Text(title).font(.system(size: 13, weight: .bold)).foregroundColor(p.ink).lineLimit(1)
            Spacer(minLength: 0)
        }
    }
}
