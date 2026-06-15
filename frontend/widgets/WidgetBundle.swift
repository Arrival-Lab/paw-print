import WidgetKit
import SwiftUI

@main
struct PawWidgetBundle: WidgetBundle {
    var body: some Widget {
        PawTodayTasksWidget()
        PawNextEventsWidget()
        PawDashboardWidget()
    }
}
