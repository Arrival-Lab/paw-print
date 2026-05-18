/**
 * iOS Podfile 에 `use_modular_headers!` 를 추가하는 config plugin.
 *
 * 배경: react-native-firebase + useFrameworks:static + Expo 조합에서
 * "non-modular header inside framework module" 빌드 에러가 발생.
 * Podfile 에 use_modular_headers! 가 있어야 React-Core 헤더가 module 로 노출됨.
 * expo-build-properties 가 글로벌 modular_headers 옵션을 지원 안 해서 plugin 으로 직접 패치.
 *
 * withDangerousMod 로 prebuild 직후 Podfile 파일을 직접 읽고 패치 — withPodfile 보다 robust.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withModularHeaders = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      if (!fs.existsSync(podfilePath)) {
        console.warn('[withModularHeaders] Podfile not found at', podfilePath);
        return cfg;
      }
      let contents = fs.readFileSync(podfilePath, 'utf8');
      let patched = false;

      // 1) use_frameworks! 줄 뒤에 use_modular_headers! 삽입
      if (!contents.includes('use_modular_headers!')) {
        if (/use_frameworks!/m.test(contents)) {
          contents = contents.replace(
            /(use_frameworks!.*$)/m,
            '$1\n  use_modular_headers!',
          );
          patched = true;
        } else {
          console.warn('[withModularHeaders] use_frameworks! line not found');
        }
      }

      // 2) RNFirebase 를 static framework 로 빌드
      if (!contents.includes('$RNFirebaseAsStaticFramework')) {
        contents = '$RNFirebaseAsStaticFramework = true\n\n' + contents;
        patched = true;
      }

      // 3) post_install hook 에 CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES 강제.
      //    use_modular_headers! 만으로 React-Core 헤더가 module 처리 안 되는 케이스의 최종 안전망.
      //    Xcode 의 -Wnon-modular-include-in-framework-module 경고를 에러로 띄우지 않도록 함.
      const allowNonModularPatch = `installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`;
      if (!contents.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
        if (/post_install do \|installer\|/.test(contents)) {
          contents = contents.replace(
            /(post_install do \|installer\|\s*\n)/,
            `$1    ${allowNonModularPatch}\n`,
          );
          patched = true;
        } else {
          // post_install hook 자체가 없으면 마지막 end 앞에 추가
          contents = contents.replace(
            /(\nend\s*)$/,
            `\n  post_install do |installer|\n    ${allowNonModularPatch}\n  end\n$1`,
          );
          patched = true;
        }
      }

      if (patched) {
        fs.writeFileSync(podfilePath, contents);
        console.log('[withModularHeaders] patched Podfile (modular_headers + RNFirebaseAsStaticFramework + CLANG_ALLOW_NON_MODULAR_INCLUDES)');
      } else {
        console.log('[withModularHeaders] Podfile already patched, skipping');
      }
      return cfg;
    },
  ]);
};

module.exports = withModularHeaders;
module.exports.default = withModularHeaders;
