import ExpoModulesCore
import WidgetKit

// 이 파일은 빌드 시 @bittingz/expo-widgets 의 앱 측 네이티브 모듈(ExpoWidgetsModule)로 복사된다 (withModule).
// JS setWidgetData(JSON 문자열) → App Group suite 의 "MyData" 키 저장 + 위젯 즉시 리로드.
// suite 이름은 group.{bundleId}.expowidgets 형식 — 위젯 타깃(PawWidgetData.swift)·entitlement 와 일치해야 한다.
public class ExpoWidgetsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoWidgets")

        Function("setWidgetData") { (data: String) -> Void in
            let suite = UserDefaults(suiteName: "group.com.arrivallab.pawprint.expowidgets")
            suite?.set(data, forKey: "MyData")
            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
}
