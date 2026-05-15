# editor-interaction-styling Specification

## Purpose
TBD - created by archiving change fix-editor-interaction-styling. Update Purpose after archive.
## Requirements
### Requirement: Canvas interaction states remain stable

缂栬緫鍣ㄧ敾甯?SHALL 鍦ㄤ笉鏀瑰彉搴曞眰缁勪欢 schema 鐨勫墠鎻愪笅锛屾彁渚涚ǔ瀹氱殑鍝嶅簲寮忓搴﹀垏鎹€乭over 鍙嶉銆侀€変腑鍙嶉銆佹嫋鎷藉弽棣堝拰缁撴瀯蹇嵎鎿嶄綔銆?

#### Scenario: Switch canvas viewport width
- **WHEN** 鐢ㄦ埛鍦ㄦ闈€佸钩鏉垮拰鎵嬫満鐢诲竷瀹藉害涔嬮棿鍒囨崲
- **THEN** 鐢诲竷鍐呭鍦ㄦ墍閫夊搴︿笅淇濇寔鍙銆佸眳涓笖鍙紪杈?

#### Scenario: Select component from canvas
- **WHEN** 鐢ㄦ埛鐐瑰嚮涓€涓凡娓叉煋鐨勫彲缂栬緫缁勪欢
- **THEN** 璇ョ粍浠惰繘鍏ラ€変腑鐘舵€侊紝閫変腑閬僵涓庡疄闄呮覆鏌撲綅缃榻愶紝璁剧疆闈㈡澘灞曠ず璇ョ粍浠?

#### Scenario: Drag material into canvas
- **WHEN** 鐢ㄦ埛灏嗗厑璁告姇鏀剧殑鐗╂枡鎷栧叆椤甸潰鎴栧鍣ㄧ粍浠?
- **THEN** 缂栬緫鍣ㄥ睍绀烘湁鏁堟姇鏀惧弽棣堬紝骞跺湪涓嶇敓鎴愰潪娉曠埗瀛愬叧绯荤殑鎯呭喌涓嬫坊鍔犵粍浠?

#### Scenario: Use structural quick action
- **WHEN** 鐢ㄦ埛瀵归€変腑鐨勯潪鏍圭粍浠舵墽琛屽鍒躲€佺Щ鍔ㄣ€佸寘瑁规垨鍒犻櫎绛夋敮鎸佺殑蹇嵎鎿嶄綔
- **THEN** 缁勪欢鏍戞洿鏂帮紝鍚屾椂淇濇寔鍚堟硶 parentId 鍜屾牴 Page 淇濇姢瑙勫垯

#### Scenario: Reposition context menu on another component
- **WHEN** 鐢ㄦ埛鍦ㄤ竴涓粍浠朵笂鎵撳紑鍙抽敭鑿滃崟鍚庯紝涓嶅叧闂彍鍗曞苟缁х画鍙抽敭鍙︿竴涓彲缂栬緫缁勪欢
- **THEN** 鍙抽敭鑿滃崟绉诲姩鍒版柊鐨勯紶鏍囦綅缃紝骞朵笖鎿嶄綔鐩爣鍒囨崲涓烘柊缁勪欢

### Requirement: Material panel supports efficient discovery and insertion

鐗╂枡闈㈡澘 SHALL 鏀寔鐢ㄦ埛閫氳繃鍒嗙被銆佹悳绱€佹敹钘忓拰妯℃澘鍙戠幇骞舵彃鍏ョ墿鏂欙紝鍚屾椂淇濇寔娓呮櫚鐨勬嫋鎷借瑙夊弽棣堛€?

#### Scenario: Search materials
- **WHEN** 鐢ㄦ埛杈撳叆鐗╂枡鍏抽敭璇?
- **THEN** 鐗╂枡闈㈡澘鎸夊悕绉般€佹弿杩般€佸垎绫绘垨鍏抽敭璇嶈繃婊ゅ彲瑙佺墿鏂?

#### Scenario: Empty material search
- **WHEN** 鐗╂枡鎼滅储娌℃湁鍖归厤椤?
- **THEN** 闈㈡澘灞曠ず绌虹姸鎬侊紝鑰屼笉鏄┖鐧芥垨鐮存崯甯冨眬

#### Scenario: Toggle favorite material
- **WHEN** 鐢ㄦ埛鍒囨崲鐗╂枡鏀惰棌鐘舵€?
- **THEN** 鏀惰棌鐘舵€佸湪鐗╂枡闈㈡澘涓洿鏂帮紝骞跺彲鍦ㄦ敹钘忚鍥句腑缁х画璁块棶

#### Scenario: Insert built-in template
- **WHEN** 鐢ㄦ埛鎻掑叆鍐呯疆妯℃澘
- **THEN** 鐢熸垚鐨勭粍浠舵爲閫氳繃姝ｅ父缂栬緫鍣ㄧ粍浠舵爲娴佺▼娣诲姞锛屽苟淇濇寔鍚堟硶鐖跺瓙鍏崇郴

### Requirement: Settings panel remains readable and searchable

璁剧疆闈㈡澘 SHALL 灞曠ず褰撳墠閫変腑缁勪欢韬唤淇℃伅锛屽苟鎻愪緵鍙銆佸彲鎼滅储銆佸彲鍒嗙粍鐨勫睘鎬с€佹牱寮忋€佷簨浠堕厤缃〉绛撅紱灞炴€ч〉绛?MUST 鏀寔鏇村甯哥敤缁勪欢灞炴€у拰閫傚悎灞炴€х被鍨嬬殑缂栬緫鎺т欢銆?

#### Scenario: Selected component details
- **WHEN** 涓€涓粍浠惰閫変腑
- **THEN** 璁剧疆闈㈡澘鍦ㄧ揣鍑戝ご閮ㄥ睍绀虹粍浠跺悕绉般€佺被鍨嬪拰 id

#### Scenario: Search settings
- **WHEN** 鐢ㄦ埛鍦ㄥ睘鎬с€佹牱寮忔垨浜嬩欢涓悳绱?
- **THEN** 闈㈡澘杩囨护褰撳墠椤电鐩稿叧鎺т欢锛屽苟涓斾笉淇敼缁勪欢鏁版嵁

#### Scenario: Empty settings search
- **WHEN** 褰撳墠璁剧疆鎼滅储娌℃湁鍖归厤鎺т欢
- **THEN** 闈㈡澘灞曠ず绌虹姸鎬侊紝璇存槑娌℃湁鎵惧埌鍖归厤閰嶇疆

#### Scenario: Edit component configuration
- **WHEN** 鐢ㄦ埛淇敼鏀寔鐨勫睘鎬с€佹牱寮忔垨浜嬩欢鍔ㄤ綔
- **THEN** 缁勪欢鏍戦€氳繃鐜版湁 store action 鏇存柊锛屽苟淇濇寔鍙繚瀛樺拰鍙瑙?

#### Scenario: Display grouped property configuration
- **WHEN** 鐢ㄦ埛鎵撳紑閫変腑缁勪欢鐨勫睘鎬ч〉绛?
- **THEN** 灞炴€ч厤缃?MUST 鎸夆€滃熀鏈€濃€滄暟鎹€濃€滅Щ鍔ㄧ鈥濈瓑璇箟鍒嗙粍灞曠ず锛屽苟鍦ㄥ垎缁勬爣棰樹腑鎻愪緵鏁伴噺鎻愮ず鎴栨竻鏅版爣棰?

#### Scenario: Filter grouped property configuration
- **WHEN** 鐢ㄦ埛鍦ㄥ睘鎬ч〉绛炬悳绱㈠睘鎬у悕绉版垨鏍囩
- **THEN** 璁剧疆闈㈡澘 MUST 鍙睍绀哄寘鍚尮閰嶅睘鎬х殑鍒嗙粍鍜屽瓧娈碉紝骞朵繚鐣欏睘鎬ч〉绛句笌褰撳墠閫変腑缁勪欢涓嶅彉

#### Scenario: Edit boolean property with compact control
- **WHEN** 鐢ㄦ埛缂栬緫绂佺敤銆佹樉绀鸿竟妗嗐€佷晶鏍忓浐瀹氥€佷笅鎷夊埛鏂扮瓑甯冨皵灞炴€?
- **THEN** 灞炴€ч〉绛?MUST 浣跨敤寮€鍏虫垨澶嶉€夋绫绘帶浠惰〃杈惧竷灏旂姸鎬侊紝鑰屼笉鏄姹傜敤鎴蜂粠鈥滄槸/鍚︹€濅笅鎷夋涓€夋嫨

#### Scenario: Edit page-level properties
- **WHEN** 鐢ㄦ埛閫変腑 Page 缁勪欢
- **THEN** 灞炴€ч〉绛?MUST 灞曠ず椤甸潰鏍囬銆佸壇鏍囬銆佸尯鍩熷睍绀恒€佹帶浠舵彁绀恒€佷晶鏍忓搴﹀彲璋冭妭銆佷晶鏍忓浐瀹氥€佺粍浠堕潤鎬佹暟鎹€佸垵濮嬪寲鎺ュ彛銆佺Щ鍔ㄧ涓嬫媺鍒锋柊绛夐〉闈㈢骇閰嶇疆

#### Scenario: Edit common material properties
- **WHEN** 鐢ㄦ埛閫変腑 Button銆乀ext銆両mage銆丆ontainer銆丆ard銆丗orm銆両nput銆丼elect銆乀able 绛夊父鐢ㄧ墿鏂?
- **THEN** 灞炴€ч〉绛?MUST 灞曠ず璇ョ墿鏂欏父鐢ㄧ殑鍩虹銆佺姸鎬併€佹暟鎹垨灞曠ず灞炴€э紝骞跺皢淇敼鍐欏叆褰撳墠缁勪欢 `props`

#### Scenario: Edit JSON-like property
- **WHEN** 鐢ㄦ埛缂栬緫椤甸潰鍙橀噺銆佹暟鎹簮銆侀潤鎬佹暟鎹€佽〃鏍兼暟鎹垨閫夐」鏁版嵁绛?JSON 绫诲睘鎬?
- **THEN** 灞炴€ч〉绛?MUST 鎻愪緵澶氳缂栬緫鎺т欢鍜屾牸寮忔彁绀猴紝骞跺湪鏍煎紡涓嶅悎娉曟椂缁欏嚭鍙嶉鑰屼笉鐮村潖鐢ㄦ埛宸茶緭鍏ュ唴瀹?

#### Scenario: Edit style configuration
- **WHEN** 鐢ㄦ埛鍦ㄥ瑙傞潰鏉夸慨鏀瑰揩鎹锋牱寮忔垨 CSS 婧愮爜
- **THEN** 閫変腑缁勪欢鐨勭敾甯冩牱寮忕珛鍗虫洿鏂帮紝骞朵笖涓嶄細鍥犱负棰戠箒杈撳叆鑰屼涪澶辩劍鐐?

#### Scenario: Edit px dimension style
- **WHEN** 鐢ㄦ埛鍦ㄥ瑙傞潰鏉跨紪杈戝搴︺€侀珮搴︺€侀棿璺濈瓑 px 灏哄鏍峰紡
- **THEN** 杈撳叆妗嗗彧瑕佹眰濉啓鏁板瓧锛宲x 浣滀负鍥哄畾鍚庣紑灞曠ず锛屾竻绌烘暟瀛楁椂璇ユ牱寮忎粠缁勪欢 styles 涓Щ闄?

#### Scenario: Style inner form controls
- **WHEN** 鐢ㄦ埛缁欐寜閽€佽緭鍏ユ銆佷笅鎷夋绛夋帶浠剁被鐗╂枡閰嶇疆瀹藉害銆佸瓧鍙枫€侀鑹层€佸唴杈硅窛绛夊瑙傛牱寮?
- **THEN** 灏哄瀹氫綅鏍峰紡鐢ㄤ簬缂栬緫鍣ㄥ彲閫変腑澶栧３锛屾帶浠惰瑙夋牱寮忓簲鐢ㄥ埌鐪熷疄 Ant Design 鎺т欢鏈韩锛岃€屼笉鏄彧鏀瑰彉钃濊壊閫変腑妗?

#### Scenario: Reset component styles
- **WHEN** 鐢ㄦ埛鍦ㄥ瑙傞潰鏉跨偣鍑绘仮澶嶉粯璁ゆ牱寮?
- **THEN** 閫変腑缁勪欢鐨勮嚜瀹氫箟 styles 琚竻绌猴紝鐢诲竷鎭㈠璇ョ粍浠剁殑榛樿澶栬锛屽瑙傝〃鍗曞拰 CSS 婧愮爜鍚屾閲嶇疆

### Requirement: Source and outline panels remain consistent with canvas state

婧愮爜闈㈡澘鍜屽ぇ绾查潰鏉?SHALL 涓庡綋鍓嶇粍浠舵爲鍜岄€変腑缁勪欢淇濇寔鍚屾锛屽悓鏃朵繚鐣欑幇鏈夋牎楠岃涓恒€?

#### Scenario: Apply valid source JSON
- **WHEN** 鐢ㄦ埛浠庢簮鐮侀潰鏉垮簲鐢ㄥ悎娉曟簮鐮?JSON
- **THEN** 缂栬緫鍣ㄦ牎楠岀粍浠舵爲锛屽苟涓斿彧鍦ㄧ‘璁ゅ悗鏇挎崲鐢诲竷

#### Scenario: Reject invalid source JSON
- **WHEN** 鐢ㄦ埛灏濊瘯搴旂敤闈炴硶 JSON 鎴栭潪娉曠粍浠舵爲
- **THEN** 缂栬緫鍣ㄤ繚鐣欏綋鍓嶇敾甯冪姸鎬佸苟鏄剧ず閿欒

#### Scenario: Select from outline
- **WHEN** 鐢ㄦ埛鍦ㄥぇ绾查潰鏉夸腑閫夋嫨缁勪欢
- **THEN** 鐢诲竷閫変腑鐘舵€佸拰璁剧疆闈㈡澘鍚屾鍒板悓涓€涓粍浠?

#### Scenario: Reorder from outline
- **WHEN** 鐢ㄦ埛閫氳繃澶х翰闈㈡澘鎺掑簭鎴栫Щ鍔ㄧ粍浠?
- **THEN** 缂栬緫鍣ㄦ墽琛屼笌鐢诲竷鎷栨嫿鐩稿悓鐨勭埗瀛愬叧绯昏鍒?

### Requirement: Editor regression coverage protects affected workflows

椤圭洰 SHALL 涓烘湰娆?change 瑙﹀強鐨勭紪杈戝櫒宸ヤ綔娴佹彁渚涘洖褰掕鐩栥€?

#### Scenario: Run editor regression test
- **WHEN** 鍦ㄥ噯澶囧ソ鐨勬湰鍦扮幆澧冧腑鎵ц `npm run test:e2e:editor`
- **THEN** 娴嬭瘯瑕嗙洊鍙楀奖鍝嶇殑鐢诲竷銆佺墿鏂欓潰鏉裤€佽缃潰鏉裤€佹簮鐮?澶х翰鍜岄瑙堝伐浣滄祦锛屽苟涓斾笉澶辫触

#### Scenario: Run local quality checks
- **WHEN** 瀹炵幇瀹屾垚
- **THEN** `npm run lint`銆乣npm run build`銆乣npm run test:e2e:editor` 绛夌浉鍏虫湰鍦版鏌ラ€氳繃锛屾垨鏄庣‘璁板綍鏈繍琛屽師鍥?

### Requirement: Control dimensions apply to real editable controls

缂栬緫鍣?SHALL 鍏佽鎺т欢绫荤墿鏂欓€氳繃澶栬闈㈡澘鎴?CSS 婧愮爜閰嶇疆瀹藉害鍜岄珮搴︼紝骞朵笖杩欎簺灏哄 MUST 鍚屾椂鍙嶆槧鍦ㄧ敾甯冨彲閫変腑澶栧３鍜岀湡瀹炴帶浠舵湰浣撲笂銆?

#### Scenario: Resize button dimensions
- **WHEN** 鐢ㄦ埛閫変腑 Button 鐗╂枡骞跺湪澶栬闈㈡澘涓缃搴︽垨楂樺害
- **THEN** Button 鐨勭紪杈戝櫒閫変腑妗嗗拰鐪熷疄 `button` 鎺т欢閮芥寜璁剧疆鍚庣殑灏哄鏇存柊

#### Scenario: Resize input dimensions
- **WHEN** 鐢ㄦ埛閫変腑 Input 鐗╂枡骞跺湪澶栬闈㈡澘涓缃搴︽垨楂樺害
- **THEN** Input 鐨勭紪杈戝櫒澶栧３鍜岀湡瀹炶緭鍏ユ閮芥寜璁剧疆鍚庣殑灏哄鏇存柊锛岃€屼笉鏄彧鏀瑰彉澶栧眰钃濊壊閫変腑妗?

#### Scenario: Resize select-like controls
- **WHEN** 鐢ㄦ埛閫変腑 Select銆乀extarea銆丏atePicker 鎴栫被浼煎崟鎺т欢鐗╂枡骞惰缃搴︽垨楂樺害
- **THEN** 鐢诲竷涓殑鐪熷疄 Ant Design 鎺т欢鍙灏哄搴旈殢鏍峰紡鏇存柊锛屽悓鏃朵繚鎸侀€変腑妗嗕笌鎺т欢浣嶇疆瀵归綈

#### Scenario: Clear dimension style
- **WHEN** 鐢ㄦ埛娓呯┖鎺т欢瀹藉害鎴栭珮搴﹀瓧娈?
- **THEN** 瀵瑰簲灏哄鏍峰紡 MUST 浠庣粍浠?`styles` 涓Щ闄わ紝鐪熷疄鎺т欢鍜岀紪杈戝櫒澶栧３閮芥仮澶嶉粯璁ゅ昂瀵?

#### Scenario: Reset control dimensions
- **WHEN** 鐢ㄦ埛鐐瑰嚮鎭㈠榛樿鏍峰紡
- **THEN** 鎺т欢绫荤墿鏂欑殑鑷畾涔夊搴﹀拰楂樺害琚竻绌猴紝鐪熷疄鎺т欢涓嶅啀淇濈暀姝ゅ墠閰嶇疆鐨勫昂瀵?

### Requirement: Interactive display materials update visible state
Tabs銆丳agination 鍜屽彲鐐瑰嚮 Steps 鐗╂枡 SHALL 鍦ㄩ瑙堟€佸拰鍙戝竷椤靛搷搴旂敤鎴风偣鍑诲苟鏇存柊鍙鐘舵€侊紝鍚屾椂 MUST 淇濈暀宸查厤缃簨浠跺姩浣滅殑瑙﹀彂鑳藉姏銆?

#### Scenario: Switch tabs in runtime
- **WHEN** 鐢ㄦ埛鍦ㄩ瑙堟€佹垨鍙戝竷椤电偣鍑?Tabs 鐨勫叾瀹冩爣绛?
- **THEN** 褰撳墠婵€娲绘爣绛?MUST 鍒囨崲鍒扮敤鎴风偣鍑荤殑鏍囩
- **AND** Tabs 鐨?change 浜嬩欢鍔ㄤ綔 MUST 缁х画鏀跺埌褰撳墠 key

#### Scenario: Switch pagination page in runtime
- **WHEN** 鐢ㄦ埛鍦ㄩ瑙堟€佹垨鍙戝竷椤电偣鍑?Pagination 鐨勫叾瀹冮〉鐮?
- **THEN** 褰撳墠椤电爜 MUST 鍒囨崲鍒扮敤鎴风偣鍑荤殑椤电爜
- **AND** Pagination 鐨?change 浜嬩欢鍔ㄤ綔 MUST 缁х画鏀跺埌褰撳墠椤电爜鍜岄〉澶у皬

#### Scenario: Switch clickable step in runtime
- **WHEN** Steps 鐗╂枡鍏佽鐐瑰嚮骞朵笖鐢ㄦ埛鐐瑰嚮鍏跺畠姝ラ
- **THEN** 褰撳墠姝ラ MUST 鍒囨崲鍒扮敤鎴风偣鍑荤殑姝ラ
- **AND** Steps 鐨?change 浜嬩欢鍔ㄤ綔 MUST 缁х画鏀跺埌褰撳墠姝ラ绱㈠紩

### Requirement: Page settings expose only effective runtime controls
Page 灞炴€ч潰鏉?SHALL 閬垮厤灞曠ず娌℃湁杩愯鎬佽涓虹殑閰嶇疆鍏ュ彛锛涘凡灞曠ず鐨?Page 閰嶇疆 MUST 鑳藉湪缂栬緫鎬併€侀瑙堟€併€佸彂甯冮〉鎴栨暟鎹厤缃摼璺腑浜х敓鍙В閲婃晥鏋溿€?

#### Scenario: Edit effective page settings
- **WHEN** 鐢ㄦ埛閫変腑 Page 缁勪欢
- **THEN** 灞炴€ч潰鏉?MUST 灞曠ず椤甸潰鏍囬銆佸壇鏍囬銆侀〉闈㈠ご閮ㄣ€佸唴瀹瑰尯銆丼EO銆佸彉閲忓拰鏁版嵁婧愮瓑鏈夋晥閰嶇疆
- **AND** 淇敼杩欎簺閰嶇疆 MUST 缁х画鍐欏叆褰撳墠 Page props

#### Scenario: Hide unfinished page settings
- **WHEN** 鐢ㄦ埛閫変腑 Page 缁勪欢
- **THEN** 灞炴€ч潰鏉?MUST NOT 灞曠ず灏氭湭瀹炵幇杩愯鎬佽涓虹殑宸ュ叿鏍忋€佷晶鏍忋€佹帶浠舵彁绀恒€佷笅鎷夊埛鏂般€佸垵濮嬪寲鎺ュ彛鍜岄潤鎬佺粍浠舵暟鎹叆鍙?

### Requirement: Permission feedback matches the attempted action
缂栬緫鍣ㄦ潈闄愭彁绀?SHALL 鍑嗙‘鎻忚堪鐢ㄦ埛灏濊瘯鎵ц鐨勫姩浣溿€?

#### Scenario: Viewer cannot rollback page version
- **WHEN** 鍙湁鏌ョ湅鏉冮檺鐨勭敤鎴疯Е鍙戦〉闈㈢増鏈洖婊氫繚鎶ら€昏緫
- **THEN** 绯荤粺 MUST 鎻愮ず褰撳墠瑙掕壊涓嶈兘鍥炴粴椤甸潰
- **AND** 鎻愮ず鏂囨湰 MUST NOT 璇啓涓轰笉鑳藉垹闄ょ増鏈?

### Requirement: AI builder interaction remains inspectable and reversible

缂栬緫鍣?SHALL 涓?AI 椤甸潰鎼缓鎻愪緵鍙銆佸彲妫€鏌ャ€佸彲鍙栨秷鍜屽彲鎭㈠鐨勪氦浜掍綋楠屻€侫I 鐢熸垚鍏ュ彛銆佺敓鎴愪腑鐘舵€併€佺粨鏋滈瑙堛€佽鍛娿€侀敊璇拰纭鍐欏叆 MUST 涓庣幇鏈夌紪杈戝櫒/鍚庡彴瑙嗚鏍囧噯淇濇寔涓€鑷达紝骞堕伩鍏嶉伄鎸＄敾甯冩牳蹇冩搷浣溿€?

#### Scenario: Open AI builder panel
- **WHEN** 鐢ㄦ埛浠庣紪杈戝櫒涓墦寮€ AI 椤甸潰鎼缓鍏ュ彛
- **THEN** 绯荤粺 MUST 灞曠ず鍙緭鍏ラ〉闈㈡弿杩般€佹帴鍙ｈ鏄庢垨鍝嶅簲绀轰緥鐨勯潰鏉?
- **AND** 闈㈡澘 MUST 淇濇寔褰撳墠鐢诲竷鍙鎴栨彁渚涙竻鏅扮殑杩斿洖缂栬緫鍏ュ彛

#### Scenario: Show generation progress
- **WHEN** AI 椤甸潰鐢熸垚姝ｅ湪杩涜
- **THEN** 绯荤粺 MUST 灞曠ず鐢熸垚涓姸鎬?
- **AND** 鐢ㄦ埛 MUST 鑳藉彇娑堟垨鍏抽棴鐢熸垚娴佺▼涓斿綋鍓嶇粍浠舵爲涓嶈淇敼

#### Scenario: Inspect AI result before applying
- **WHEN** AI 杩斿洖鐢熸垚缁撴灉
- **THEN** 绯荤粺 MUST 灞曠ず鐢熸垚鎽樿銆佽鍛娿€侀敊璇垨鍙簲鐢ㄨ寖鍥?
- **AND** 鐢ㄦ埛纭鍓?MUST NOT 鐩存帴瑕嗙洊褰撳墠缁勪欢鏍?

#### Scenario: Reject invalid AI result visibly
- **WHEN** AI 缁撴灉鏈€氳繃 schema 鎴栧畨鍏ㄦ牎楠?
- **THEN** 绯荤粺 MUST 浠ュ彲璇婚敊璇弽棣堣鏄庡け璐ュ師鍥?
- **AND** 鐢诲竷銆佹簮鐮侀潰鏉垮拰璁剧疆闈㈡澘 MUST 淇濇寔鐢熸垚鍓嶇姸鎬?

### Requirement: AI agent panel remains understandable and controllable
缂栬緫鍣?SHALL 涓?AI agent 鎻愪緵鍙銆佸彲鎺с€佸彲鍙栨秷鐨勫璇濆紡闈㈡澘銆傞潰鏉?MUST 灞曠ず agent 姝ｅ湪浣跨敤鐨勪笂涓嬫枃鑼冨洿銆佹墽琛屾楠ゃ€佸伐鍏疯皟鐢ㄦ憳瑕併€佸€欓€変慨鏀广€亀arnings銆乤ssumptions銆侀敊璇拰纭鍏ュ彛銆?

#### Scenario: Start agent from editor
- **WHEN** 鐢ㄦ埛浠庣紪杈戝櫒鎵撳紑 AI agent 闈㈡澘
- **THEN** 闈㈡澘 MUST 鍏佽杈撳叆淇敼璇夋眰骞堕€夋嫨鐩爣鑼冨洿
- **AND** 闈㈡澘 MUST 灞曠ず褰撳墠椤甸潰銆侀€変腑缁勪欢鎴栨暣椤佃寖鍥寸瓑涓婁笅鏂囨彁绀?

#### Scenario: Show agent progress
- **WHEN** agent run 姝ｅ湪鎵ц
- **THEN** 闈㈡澘 MUST 灞曠ず璁″垝銆佸綋鍓嶆楠ゆ垨宸ュ叿璋冪敤鎽樿
- **AND** 鐢ㄦ埛 MUST 鑳藉彇娑堟湰娆?run

#### Scenario: Inspect candidate diff
- **WHEN** agent 杩斿洖鍊欓€?patch 鎴栧€欓€夌粍浠舵爲
- **THEN** 闈㈡澘 MUST 灞曠ず褰卞搷鑼冨洿銆佹憳瑕併€亀arnings 鍜?assumptions
- **AND** 鐢ㄦ埛纭鍓?MUST NOT 淇敼褰撳墠缁勪欢鏍?

#### Scenario: Show validation repair feedback
- **WHEN** agent 鍊欓€夌粨鏋滅粡鍘嗘牎楠屽け璐ュ拰淇
- **THEN** 闈㈡澘 MUST 灞曠ず淇鎽樿鎴栨渶缁堝け璐ュ師鍥?
- **AND** 閿欒淇℃伅 MUST 鑳藉府鍔╃敤鎴疯皟鏁?prompt 鎴栫洰鏍囪寖鍥?

### Requirement: AI agent UI does not block core editing
AI agent 闈㈡澘 SHALL 涓庣幇鏈夌紪杈戝櫒甯冨眬鍗忓悓锛岄伩鍏嶉伄鎸＄敾甯冩牳蹇冩搷浣滐紝骞跺湪绐勫睆鎴栭潰鏉跨┖闂翠笉瓒虫椂淇濇寔鍙粴鍔ㄣ€佸彲鍏抽棴鍜屽彲杩斿洖缂栬緫鐘舵€併€?

#### Scenario: Keep canvas accessible
- **WHEN** 鐢ㄦ埛鎵撳紑 AI agent 闈㈡澘
- **THEN** 鐢诲竷 MUST 淇濇寔鍙鎴栨彁渚涙槑纭殑杩斿洖缂栬緫鍏ュ彛
- **AND** 鏈‘璁ょ殑鍊欓€変慨鏀?MUST 涓嶅奖鍝嶇敾甯冮€夋嫨銆佹簮鐮侀潰鏉垮拰璁剧疆闈㈡澘鐘舵€?

#### Scenario: Handle long run details
- **WHEN** agent run 鍖呭惈澶氭璁″垝銆佸涓伐鍏疯皟鐢ㄦ垨杈冮暱 warning 鍒楄〃
- **THEN** 闈㈡澘 MUST 浠ュ彲鎵弿銆佸彲鎶樺彔鎴栧彲婊氬姩鏂瑰紡灞曠ず
- **AND** 鏂囨湰 MUST 涓嶄笌鎸夐挳銆侀瑙堟垨閿欒鎻愮ず閲嶅彔
### Requirement: Data model management follows project dashboard interaction standards
鏁版嵁妯″瀷绠＄悊椤甸潰 SHALL 浣跨敤鐜版湁椤圭洰鍚庡彴鐨勫伐浣滃彴寮忓竷灞€锛屼繚鎸佽〃鏍笺€佽〃鍗曘€佹娊灞夋垨寮圭獥鐨勫彲璇绘€у拰涓€鑷翠氦浜掋€?

#### Scenario: Browse data models
- **WHEN** 鐢ㄦ埛杩涘叆椤圭洰鐨勬暟鎹ā鍨嬬鐞嗗叆鍙?
- **THEN** 椤甸潰 MUST 灞曠ず妯″瀷鍒楄〃銆佹悳绱㈡垨绛涢€夊叆鍙ｃ€佸垱寤哄叆鍙ｅ拰绌虹姸鎬?
- **AND** 甯冨眬 MUST 鍦ㄦ闈㈠拰绉诲姩瀹藉害涓嬮伩鍏嶆í鍚戞孩鍑?

#### Scenario: Edit model fields
- **WHEN** 鐢ㄦ埛鍒涘缓鎴栫紪杈戞暟鎹ā鍨嬪瓧娈?
- **THEN** 瀛楁閰嶇疆 MUST 浣跨敤閫傚悎绫诲瀷鐨勬帶浠?
- **AND** 蹇呭～銆佸睍绀轰綅缃拰閫夐」閰嶇疆 MUST 缁欏嚭鍗虫椂鍙悊瑙ｇ殑鏍￠獙鍙嶉

### Requirement: CRUD generation wizard is concise and reversible
CRUD 鐢熸垚鍚戝 SHALL 寮曞鐢ㄦ埛閫夋嫨妯″瀷銆侀〉闈㈢被鍨嬨€佽矾鐢卞拰鐢熸垚閫夐」锛屽苟鍦ㄧ湡姝ｅ垱寤洪〉闈㈠墠灞曠ず鍙‘璁ょ殑缁撴灉鎽樿銆?

#### Scenario: Preview generation summary
- **WHEN** 鐢ㄦ埛瀹屾垚鐢熸垚鍚戝閰嶇疆
- **THEN** 鍚戝 MUST 灞曠ず灏嗗垱寤虹殑椤甸潰鍚嶇О銆佽矾鐢便€侀〉闈㈢被鍨嬪拰鐩爣妯″瀷
- **AND** 鐢ㄦ埛 MUST 鑳借繑鍥炰笂涓€姝ヤ慨鏀归厤缃?

#### Scenario: Show generation errors
- **WHEN** CRUD 椤甸潰鐢熸垚澶辫触鎴栬矾鐢卞啿绐?
- **THEN** 鍚戝 MUST 鍦ㄥ綋鍓嶄綅缃睍绀洪敊璇俊鎭?
- **AND** 椤甸潰 MUST 淇濈暀鐢ㄦ埛宸茶緭鍏ョ殑鐢熸垚閰嶇疆

### Requirement: Generated CRUD pages match editor canvas conventions
鐢熸垚鐨?CRUD 椤甸潰 SHALL 浣跨敤鐜版湁鐗╂枡鐨勭紪杈戞€佸拰棰勮鎬佺害瀹氾紝閬垮厤鎶婅繍琛屾椂寮瑰眰鎴栧崰浣嶅澹宠褰撲綔甯搁┗椤甸潰鍐呭銆?

#### Scenario: Generate stable list layout
- **WHEN** 鐢熸垚鍣ㄥ垱寤哄垪琛ㄩ〉
- **THEN** 鍒楄〃椤?MUST 浣跨敤閫傚悎缂栬緫鍜岄瑙堢殑甯搁┗甯冨眬瀹瑰櫒
- **AND** Table銆佺瓫閫夊尯鍜屾搷浣滄寜閽?MUST 鍦ㄧ紪杈戠敾甯冧腑淇濇寔鍙€変腑銆佸彲璋冩暣鍜屽彲淇濆瓨

#### Scenario: Generate stable form layout
- **WHEN** 鐢熸垚鍣ㄥ垱寤鸿〃鍗曢〉
- **THEN** 琛ㄥ崟椤?MUST 浣跨敤 Form 鍜?FormItem 鐢熸垚鐪熷疄瀛楁
- **AND** 棰勮鎬?MUST 涓嶄緷璧栫紪杈戞€佹嫋鎷藉崰浣嶆枃妗堟潵琛ㄨ揪涓氬姟鍐呭
