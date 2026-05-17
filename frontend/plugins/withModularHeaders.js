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
        if (!/use_frameworks!/m.test(contents)) {
          console.warn('[withModularHeaders] use_frameworks! line not found, skipping');
          return cfg;
        }
        contents = contents.replace(
          /(use_frameworks!.*$)/m,
          '$1\n  use_modular_headers!',
        );
        patched = true;
      }

      // 2) RNFirebase 를 static framework 로 빌드 — modular_headers 만으로
      //    "non-modular header inside framework module" 가 안 풀리는 경우의 RNFirebase 공식 권장 fix.
      if (!contents.includes('$RNFirebaseAsStaticFramework')) {
        contents = '$RNFirebaseAsStaticFramework = true\n\n' + contents;
        patched = true;
      }

      if (patched) {
        fs.writeFileSync(podfilePath, contents);
        console.log('[withModularHeaders] patched Podfile (modular_headers + RNFirebaseAsStaticFramework)');
      } else {
        console.log('[withModularHeaders] Podfile already patched, skipping');
      }
      return cfg;
    },
  ]);
};

module.exports = withModularHeaders;
module.exports.default = withModularHeaders;
