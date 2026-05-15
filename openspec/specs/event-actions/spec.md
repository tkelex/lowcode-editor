# event-actions Specification

## Purpose

绾︽潫浣庝唬鐮佺紪杈戝櫒涓簨浠跺姩浣滅殑閰嶇疆銆佸綊涓€鍖栥€侀瑙堟墽琛屻€佸彂甯冮〉瀹夊叏闄愬埗鍜屽洖褰掗獙璇侊紝纭繚缁勪欢浜嬩欢鍦ㄧ紪杈戞€併€侀瑙堟€佸拰鍏紑鍙戝竷椤典腑淇濇寔鍙厤缃€佸彲杩佺Щ銆佸彲瀹¤涓斾笉绐佺牬 custom JS 涓?HTTP 瀹夊叏杈圭晫銆?

绾︽潫浣庝唬鐮佺紪杈戝櫒涓簨浠跺姩浣滅殑閰嶇疆銆佸綊涓€鍖栥€侀瑙堟墽琛屻€佸彂甯冮〉瀹夊叏闄愬埗鍜屽洖褰掗獙璇侊紝纭繚椤甸潰 schema 涓殑鍔ㄤ綔鍙紪杈戙€佸彲杩佺Щ銆佸彲瀹夊叏杩愯锛屽苟鑳芥敮鎾戠敓鎴愰〉闈㈢殑 HTTP 璇锋眰銆佺粍浠惰仈鍔ㄥ拰鏁版嵁鍒锋柊鍙嶉銆?
## Requirements
### Requirement: Event actions are configured with explicit supported behavior
缂栬緫鍣?SHALL 涓虹粍浠朵簨浠舵彁渚涘彲鍙戠幇銆佸彲缂栬緫銆佸彲鏍￠獙鐨勫姩浣滈厤缃兘鍔涳紝骞朵笖鍔ㄤ綔閰嶇疆 MUST 瀛樺偍鍦?`props.onEvent[eventName].actions` 涓€?

#### Scenario: Add a configured action
- **WHEN** 鐢ㄦ埛鍦ㄨ缃潰鏉夸负缁勪欢浜嬩欢娣诲姞涓€涓姩浣滃苟濉啓蹇呭～閰嶇疆
- **THEN** 缂栬緫鍣?MUST 灏嗗姩浣滆拷鍔犲埌璇ヤ簨浠剁殑 `props.onEvent[eventName].actions`
- **AND** 鍔ㄤ綔 MUST 淇濈暀鍏?`actionType`銆乣args` 鍜岄€氱敤鎺у埗瀛楁

#### Scenario: Reject invalid action form
- **WHEN** 鐢ㄦ埛鍦ㄥ姩浣滃脊绐椾腑缂哄皯蹇呭～椤规垨杈撳叆闈炴硶 JSON
- **THEN** 缂栬緫鍣?MUST 闃绘纭淇濆瓨璇ュ姩浣?
- **AND** 缂栬緫鍣?MUST 鍦ㄥ綋鍓嶈〃鍗曚腑灞曠ず鍙畾浣嶇殑閿欒鍙嶉

#### Scenario: Edit existing action without losing fields
- **WHEN** 鐢ㄦ埛鎵撳紑宸叉湁鍔ㄤ綔骞朵慨鏀瑰叾涓竴椤归厤缃?
- **THEN** 缂栬緫鍣?MUST 鍥炲～宸叉湁鍔ㄤ綔閰嶇疆
- **AND** 淇濆瓨鍚?MUST 淇濈暀璇ュ姩浣滄湭琚敤鎴蜂慨鏀圭殑鍏煎瀛楁鍜岄€氱敤鎺у埗瀛楁

#### Scenario: Configure nested action
- **WHEN** 鐢ㄦ埛鍦ㄧ‘璁ゅ姩浣滄垨鏉′欢鍔ㄤ綔鐨勫垎鏀腑娣诲姞銆佺紪杈戙€佸鍒躲€佺鐢ㄣ€佸垹闄ゆ垨鎺掑簭宓屽鍔ㄤ綔
- **THEN** 缂栬緫鍣?MUST 鏇存柊瀵瑰簲鍒嗘敮鐨?actions 鏁扮粍
- **AND** 宓屽鍔ㄤ綔 MUST 浣跨敤涓庨《灞傚姩浣滀竴鑷寸殑閰嶇疆銆佹牎楠屽拰鎽樿瑙勫垯

### Requirement: URL action supports explicit open target
璺宠浆閾炬帴鍔ㄤ綔 SHALL 鏀寔鐢ㄦ埛閫夋嫨褰撳墠绐楀彛鎴栨柊绐楀彛鎵撳紑锛屽苟涓旇繍琛屾椂 MUST 鎸夐厤缃墽琛屽鑸€?

#### Scenario: Navigate in current window
- **WHEN** 鐢ㄦ埛閰嶇疆璺宠浆閾炬帴鍔ㄤ綔鐨勬墦寮€鏂瑰紡涓哄綋鍓嶇獥鍙ｅ苟瑙﹀彂璇ヤ簨浠?
- **THEN** 杩愯鏃?MUST 褰掍竴鍖栭摼鎺ュ湴鍧€
- **AND** 杩愯鏃?MUST 鍦ㄥ綋鍓嶇獥鍙ｅ鑸埌璇ュ湴鍧€

#### Scenario: Navigate in new window
- **WHEN** 鐢ㄦ埛閰嶇疆璺宠浆閾炬帴鍔ㄤ綔鐨勬墦寮€鏂瑰紡涓烘柊绐楀彛骞惰Е鍙戣浜嬩欢
- **THEN** 鍔ㄤ綔 schema MUST 淇濆瓨 `args.blank` 涓?`true`
- **AND** 杩愯鏃?MUST 浣跨敤鏂扮獥鍙ｆ墦寮€褰掍竴鍖栧悗鐨勫湴鍧€

#### Scenario: Edit URL action open target
- **WHEN** 鐢ㄦ埛缂栬緫宸叉湁璺宠浆閾炬帴鍔ㄤ綔
- **THEN** 鍔ㄤ綔琛ㄥ崟 MUST 鍥炲～璺宠浆鍦板潃鍜屾墦寮€鏂瑰紡
- **AND** 鍔ㄤ綔鍒楄〃鎽樿 MUST 灞曠ず璺宠浆鍦板潃鍙婂綋鍓嶇獥鍙ｆ垨鏂扮獥鍙ｄ俊鎭?

#### Scenario: Normalize legacy URL action
- **WHEN** 鏃ч〉闈?schema 鍖呭惈 `goToLink` 鎴栨棫鐗堣烦杞瓧娈?
- **THEN** 杩佺Щ涓?normalize MUST 灏嗗叾杞崲涓?`actionType: "url"`
- **AND** 鍙瘑鍒殑鏂扮獥鍙ｉ厤缃?MUST 鏀舵暃涓?`args.blank: true`

### Requirement: Action runtime executes actions consistently
杩愯鏃?SHALL 鎸夊姩浣滄暟缁勯『搴忔墽琛屼簨浠跺姩浣滐紝骞朵笖 MUST 淇濇寔椤跺眰鍔ㄤ綔涓庡祵濂楀姩浣滅殑鎵ц璇箟涓€鑷淬€?

#### Scenario: Execute actions in order
- **WHEN** 涓€涓簨浠跺寘鍚涓湭绂佺敤鍔ㄤ綔
- **THEN** 杩愯鏃?MUST 鎸夋暟缁勯『搴忛€愪釜鎵ц鍔ㄤ綔

#### Scenario: Skip disabled action
- **WHEN** 涓€涓姩浣滆鏍囪涓?`disabled`
- **THEN** 杩愯鏃?MUST 璺宠繃璇ュ姩浣?
- **AND** 鍚庣画鍔ㄤ綔 MUST 缁х画鎸夐『搴忔墽琛?

#### Scenario: Stop action sequence
- **WHEN** 涓€涓姩浣滈厤缃簡闃绘缁х画鎵ц鐨勯€氱敤鎺у埗
- **THEN** 杩愯鏃?MUST 鎵ц瀵瑰簲娴忚鍣ㄤ簨浠舵帶鍒?
- **AND** 鍚庣画鍔ㄤ綔 MUST 鎸夌幇鏈夊仠姝㈣鍒欎腑鏂垨缁х画

#### Scenario: Execute confirm branch
- **WHEN** 鐢ㄦ埛瑙﹀彂纭鍔ㄤ綔骞剁偣鍑荤‘璁ゆ垨鍙栨秷
- **THEN** 杩愯鏃?MUST 鍙墽琛屽搴斿垎鏀腑鐨勫祵濂楀姩浣?
- **AND** 宓屽鍔ㄤ綔 MUST 浣跨敤鍚屼竴涓簨浠舵暟鎹€佸彉閲忓拰缁勪欢寮曠敤涓婁笅鏂?

#### Scenario: Execute condition branch
- **WHEN** 鐢ㄦ埛瑙﹀彂鏉′欢鍔ㄤ綔
- **THEN** 杩愯鏃?MUST 鏍规嵁琛ㄨ揪寮忕粨鏋滄墽琛?trueActions 鎴?falseActions
- **AND** 琛ㄨ揪寮忔墽琛屽け璐ユ椂 MUST 璁板綍閿欒骞堕伩鍏嶉樆濉為〉闈㈡覆鏌?

### Requirement: HTTP and data mutation actions expose reliable feedback
HTTP 璇锋眰銆佸彉閲忓啓鍏ャ€佺粍浠跺睘鎬у啓鍏ュ拰缁勪欢鏍峰紡鍐欏叆鍔ㄤ綔 SHALL 鎻愪緵鍙娴嬬殑鏁版嵁鍐欏叆鍜屽け璐ュ弽棣堛€?

#### Scenario: Execute HTTP request successfully
- **WHEN** HTTP 鍔ㄤ綔璇锋眰鎴愬姛
- **THEN** 杩愯鏃?MUST 灏嗗搷搴斿璞″啓鍏?`event.httpResponse`
- **AND** 濡傛灉閰嶇疆浜嗗搷搴斿啓鍏ュ瓧娈碉紝杩愯鏃?MUST 鍐欏叆璇ヨ矾寰?
- **AND** 濡傛灉閰嶇疆浜嗘垚鍔熸彁绀猴紝杩愯鏃?MUST 灞曠ず鎴愬姛娑堟伅

#### Scenario: Handle HTTP request failure
- **WHEN** HTTP 鍔ㄤ綔璇锋眰澶辫触鎴栫洰鏍囧煙鍚嶄笉琚厑璁?
- **THEN** 杩愯鏃?MUST 灏嗛敊璇啓鍏?`event.httpError`
- **AND** 濡傛灉閰嶇疆浜嗛敊璇啓鍏ュ瓧娈碉紝杩愯鏃?MUST 鍐欏叆璇ヨ矾寰?
- **AND** 杩愯鏃?MUST 灞曠ず閰嶇疆鐨勫け璐ユ彁绀烘垨榛樿澶辫触鎻愮ず

#### Scenario: Update component data
- **WHEN** 鐢ㄦ埛瑙﹀彂璁剧疆缁勪欢灞炴€ф垨璁剧疆缁勪欢鏍峰紡鍔ㄤ綔
- **THEN** 杩愯鏃?MUST 鍙洿鏂扮洰鏍囩粍浠剁殑瀵瑰簲 props 鎴?styles
- **AND** 鏈寚瀹氱殑鐜版湁瀛楁 MUST 淇濇寔涓嶅彉

#### Scenario: Set runtime variable
- **WHEN** 鐢ㄦ埛瑙﹀彂璁剧疆鍙橀噺鍔ㄤ綔
- **THEN** 杩愯鏃?MUST 灏嗗浐瀹氬€兼垨琛ㄨ揪寮忕粨鏋滃啓鍏ラ〉闈㈣繍琛屾椂鍙橀噺璺緞
- **AND** 鍚庣画鍔ㄤ綔鍜岃繍琛屾椂鏁版嵁缁戝畾 MUST 鑳借鍙栨洿鏂板悗鐨勫彉閲忓€?

### Requirement: Published pages keep custom script execution disabled
鍏紑鍙戝竷椤?SHALL 绂佹鎵ц鐢ㄦ埛閰嶇疆鐨勮嚜瀹氫箟 JS 鍔ㄤ綔锛屽悓鏃朵繚鎸佸叾瀹冨畨鍏ㄥ姩浣滃彲鎵ц銆?

#### Scenario: Preview allows custom script in editor
- **WHEN** 缂栬緫鍣ㄩ瑙堜互鍏佽鑷畾涔?JS 鐨勬ā寮忚繍琛屽苟瑙﹀彂 custom 鍔ㄤ綔
- **THEN** 杩愯鏃?MAY 鎵ц璇?custom 鍔ㄤ綔
- **AND** custom 鍔ㄤ綔 MUST 鍙兘璁块棶杩愯鏃舵彁渚涚殑 context銆乪vent銆乤rgs 鍜?doAction 鑳藉姏

#### Scenario: Published page skips custom script
- **WHEN** 鍏紑鍙戝竷椤佃Е鍙戝寘鍚?custom 鍔ㄤ綔鐨勪簨浠?
- **THEN** 杩愯鏃?MUST 涓嶆墽琛岃 custom 鍔ㄤ綔
- **AND** 鍚屼竴浜嬩欢涓殑鍏跺畠闈炵鐢ㄥ畨鍏ㄥ姩浣?MUST 鎸夐『搴忕户缁墽琛?

### Requirement: Event action regressions are covered by tests
椤圭洰 SHALL 涓轰簨浠跺姩浣滈厤缃€佽縼绉诲拰杩愯鏃惰涓烘彁渚涘洖褰掕鐩栥€?

#### Scenario: Run schema and runtime tests
- **WHEN** 瀹炵幇瀹屾垚鍚庢墽琛?`npm run test`
- **THEN** 娴嬭瘯 MUST 瑕嗙洊 URL 鎵撳紑鏂瑰紡銆佹棫 action schema 杩佺Щ銆丠TTP 鎴愬姛/澶辫触銆佺粍浠惰仈鍔ㄣ€佸彉閲忓啓鍏ャ€佹潯浠?纭宓屽鍜?custom 鍔ㄤ綔瀹夊叏杈圭晫

#### Scenario: Run editor event workflow test
- **WHEN** 瀹炵幇瀹屾垚鍚庢墽琛?`npm run test:e2e:editor`
- **THEN** 娴嬭瘯 MUST 瑕嗙洊鍦ㄨ缃潰鏉块厤缃烦杞墦寮€鏂瑰紡銆佺紪杈戝姩浣溿€佹煡鐪嬪姩浣滄憳瑕佸拰棰勮瑙﹀彂鍔ㄤ綔鐨勫叧閿矾寰?

#### Scenario: Run local quality checks
- **WHEN** 瀹炵幇瀹屾垚
- **THEN** `npm run lint` 鍜?`npm run build` MUST 閫氳繃锛屾垨鍦ㄤ氦浠樿鏄庝腑鏄庣‘璁板綍鏈繍琛屽師鍥犲拰鍓╀綑椋庨櫓

### Requirement: Preview runtime mutations stay isolated from design schema
缂栬緫鍣?Preview SHALL 浣跨敤鐙珛杩愯鎬佺粍浠跺揩鐓ф墽琛屼簨浠跺姩浣滐紝缁勪欢灞炴€у拰鏍峰紡鍔ㄤ綔 MUST NOT 鐩存帴鍐欏洖璁捐鎬?Zustand 缁勪欢鏍戙€?

#### Scenario: Runtime props action in editor preview
- **WHEN** 鐢ㄦ埛鍦ㄧ紪杈戝櫒棰勮鎬佽Е鍙?`setComponentProps` 鎴?`componentControl.setValue`
- **THEN** Preview MUST 鏇存柊鏈杩愯鎬佸揩鐓т腑鐨勭洰鏍囩粍浠?props
- **AND** 閫€鍑洪瑙堝悗璁捐鎬佺粍浠舵爲 MUST 淇濇寔瑙﹀彂鍓嶇殑 props

#### Scenario: Runtime styles action in editor preview
- **WHEN** 鐢ㄦ埛鍦ㄧ紪杈戝櫒棰勮鎬佽Е鍙?`setComponentStyles`
- **THEN** Preview MUST 鏇存柊鏈杩愯鎬佸揩鐓т腑鐨勭洰鏍囩粍浠?styles
- **AND** 閫€鍑洪瑙堝悗璁捐鎬佺粍浠舵爲 MUST 淇濇寔瑙﹀彂鍓嶇殑 styles

#### Scenario: Published page runtime update
- **WHEN** 鍏紑鍙戝竷椤佃Е鍙戠粍浠跺睘鎬ф垨鏍峰紡鏇存柊鍔ㄤ綔
- **THEN** 杩愯鎬?MUST 鏇存柊椤甸潰褰撳墠蹇収
- **AND** custom JS 鍔ㄤ綔 MUST 缁х画閬靛畧 `allowCustomJS={false}` 鐨勫畨鍏ㄩ檺鍒?

### Requirement: Component control value sources resolve at runtime
缁勪欢鑱斿姩璁剧疆鍊煎姩浣?SHALL 鍦ㄨ繍琛屾椂瑙ｆ瀽鍊兼潵婧愶紝鍥哄畾鍊?MUST 淇濇寔鍘熷€硷紝浜嬩欢鏁版嵁璺緞鍜岃〃杈惧紡 MUST 鍐欏叆璁＄畻鍚庣殑鐪熷疄鍊笺€?

#### Scenario: Set fixed value
- **WHEN** 鐢ㄦ埛閰嶇疆缁勪欢鑱斿姩璁剧疆鍊硷紝鍊兼潵婧愪负鍥哄畾鍊?
- **THEN** 杩愯鏃?MUST 灏嗚鍥哄畾鍊煎啓鍏ョ洰鏍囩粍浠舵寚瀹?prop

#### Scenario: Set value from event data path
- **WHEN** 鐢ㄦ埛閰嶇疆缁勪欢鑱斿姩璁剧疆鍊硷紝鍊间负 `event.value`
- **THEN** 杩愯鏃?MUST 浠庡綋鍓嶄簨浠舵暟鎹鍙?`value`
- **AND** 鍐欏叆鐩爣缁勪欢鐨?MUST 鏄簨浠剁湡瀹炲€艰€屼笉鏄瓧绗︿覆 `event.value`

#### Scenario: Set value from expression
- **WHEN** 鐢ㄦ埛閰嶇疆缁勪欢鑱斿姩璁剧疆鍊硷紝鍊间负 `{{event.value}}` 鎴栧叾瀹冨畨鍏ㄨ〃杈惧紡
- **THEN** 杩愯鏃?MUST 鍦ㄥ綋鍓嶄簨浠躲€佸彉閲忓拰涓婁笅鏂囦腑璁＄畻琛ㄨ揪寮?
- **AND** 鍐欏叆鐩爣缁勪欢鐨?MUST 鏄〃杈惧紡缁撴灉

#### Scenario: Keep runtime stable when expression fails
- **WHEN** 缁勪欢鑱斿姩鍊艰〃杈惧紡瑙ｆ瀽澶辫触
- **THEN** 杩愯鏃?MUST 閬垮厤闃诲椤甸潰娓叉煋
- **AND** 鍚庣画鍔ㄤ綔 MUST 缁х画鎸夌幇鏈夎鍒欐墽琛?

### Requirement: Generated CRUD pages use supported event actions
CRUD 鐢熸垚鍣?SHALL 鍙负鐢熸垚椤甸潰鍐欏叆褰撳墠浜嬩欢绯荤粺鏀寔骞跺彲鎵ц鐨勫姩浣滈厤缃紝鐢熸垚鍔ㄤ綔 MUST 瀛樺偍鍦?`props.onEvent[eventName].actions` 涓€?

#### Scenario: Generate create submit action
- **WHEN** 鐢熸垚鍣ㄥ垱寤烘柊寤鸿〃鍗曢〉
- **THEN** 琛ㄥ崟鎻愪氦浜嬩欢 MUST 鍖呭惈璋冪敤澶栭儴鏂板鎺ュ彛鎵€闇€鐨?HTTP action
- **AND** 鍔ㄤ綔閰嶇疆 MUST 鑳藉湪浜嬩欢鍔ㄤ綔闈㈡澘涓墦寮€鍜岀紪杈?

#### Scenario: Generate edit submit action
- **WHEN** 鐢熸垚鍣ㄥ垱寤虹紪杈戣〃鍗曢〉
- **THEN** 琛ㄥ崟鎻愪氦浜嬩欢 MUST 鍖呭惈璋冪敤澶栭儴鏇存柊鎺ュ彛鎵€闇€鐨?HTTP action
- **AND** 鍔ㄤ綔 MUST 鑳借鍙栧綋鍓嶈褰?id銆侀〉闈㈠彉閲忔垨璺敱鍙傛暟

#### Scenario: Generate delete action
- **WHEN** 鐢熸垚鍣ㄥ垱寤哄垪琛ㄩ〉鍒犻櫎鎿嶄綔
- **THEN** 鍒犻櫎鎿嶄綔 SHOULD 浣跨敤纭鍔ㄤ綔鍖呰９澶栭儴鍒犻櫎鎺ュ彛璋冪敤
- **AND** 鍒犻櫎鎴愬姛鍚?MUST 鑳芥墽琛屽埛鏂板垪琛ㄦ垨鎻愮ず鐢ㄦ埛鐨勫悗缁姩浣?

#### Scenario: Generate list operation actions
- **WHEN** 鐢熸垚鍣ㄥ垱寤哄垪琛ㄩ〉鎿嶄綔鍒楁垨鎿嶄綔鎸夐挳
- **THEN** 鎿嶄綔浜嬩欢 MUST 鍙紩鐢ㄧ敓鎴愰〉闈腑瀛樺湪鐨勭洰鏍囩粍浠躲€佽矾鐢辨垨鍙橀噺
- **AND** 鍔ㄤ綔閫夋嫨闈㈡澘 MUST NOT 瑕佹眰鐢ㄦ埛閰嶇疆褰撳墠椤甸潰涓嶅瓨鍦ㄧ殑缁勪欢鏂规硶

### Requirement: CRUD runtime actions can refresh generated data views
浜嬩欢杩愯鏃?SHALL 鏀寔鐢熸垚 CRUD 椤甸潰鍦ㄦ柊澧炪€佺紪杈戞垨鍒犻櫎澶栭儴璁板綍鍚庡埛鏂板垪琛ㄦ垨璺宠浆鍒扮洰鏍囬〉闈€?

#### Scenario: Refresh list after data mutation
- **WHEN** 鐢ㄦ埛鍦ㄧ敓鎴愰〉闈腑鏂板銆佺紪杈戞垨鍒犻櫎澶栭儴璁板綍
- **THEN** 鍚庣画鍔ㄤ綔 MUST 鑳借Е鍙戣〃鏍兼暟鎹埛鏂般€侀噸鏂拌姹傜粦瀹氭暟鎹簮鎴栫粰鍑烘槑纭殑鎵嬪姩鍒锋柊鍙嶉

#### Scenario: Navigate after form submit
- **WHEN** 鐢ㄦ埛鎻愪氦鐢熸垚琛ㄥ崟涓斿閮ㄦ帴鍙ｈ繑鍥炴垚鍔?
- **THEN** 鍚庣画鍔ㄤ綔 MUST 鑳芥寜鐢熸垚閰嶇疆杩斿洖鍒楄〃椤垫垨鎵撳紑璇︽儏椤?

#### Scenario: Surface API failure
- **WHEN** 鐢熸垚椤甸潰璋冪敤澶栭儴鎺ュ彛澶辫触
- **THEN** HTTP action MUST 灞曠ず閰嶇疆鐨勫け璐ユ彁绀烘垨榛樿澶辫触鎻愮ず
- **AND** 杩愯鏃舵棩蹇?MUST 淇濈暀鍙帓鏌ョ殑閿欒淇℃伅
