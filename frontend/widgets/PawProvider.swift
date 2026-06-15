import WidgetKit
import SwiftUI

// 세 위젯이 공유하는 타임라인 — App Group 스냅샷을 읽어 엔트리로. 30분마다 재요청(시간대 전환 반영).
// 앱이 setWidgetData + reloadAllTimelines 를 호출하면 즉시 갱신된다.
struct PawEntry: TimelineEntry {
    let date: Date
    let snapshot: PawSnapshot?
}

struct PawProvider: TimelineProvider {
    func placeholder(in context: Context) -> PawEntry {
        PawEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (PawEntry) -> Void) {
        completion(PawEntry(date: Date(), snapshot: loadPawSnapshot()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PawEntry>) -> Void) {
        let now = Date()
        let entry = PawEntry(date: now, snapshot: loadPawSnapshot())
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: now) ?? now.addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}
