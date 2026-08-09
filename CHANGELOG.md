# Changelog

## [1.3.0](https://github.com/narapov/dependency-cruiser-json-viewer/compare/v1.2.0...v1.3.0) (2026-08-09)

### Features

- add rules viewer ([#5](https://github.com/narapov/dependency-cruiser-json-viewer/issues/5)) ([171f234](https://github.com/narapov/dependency-cruiser-json-viewer/commit/171f234003d0f1e455910e3c15544ff1085cb0f4))

### Bug Fixes

- curve reverse same-Y dependency graph edges ([#6](https://github.com/narapov/dependency-cruiser-json-viewer/issues/6)) ([72f75ac](https://github.com/narapov/dependency-cruiser-json-viewer/commit/72f75acf51f7c477ca9de1b4d15f809aafc56e99))
- ignore tree checkbox clicks for show-in-graph ([a3c9fb5](https://github.com/narapov/dependency-cruiser-json-viewer/commit/a3c9fb5003c60d5ce5a65e0789f4cd65d6e2f9e6))

## [1.2.0](https://github.com/narapov/dependency-cruiser-json-viewer/compare/v1.1.0...v1.2.0) (2026-08-04)

### Features

- add watch-mode ([#4](https://github.com/narapov/dependency-cruiser-json-viewer/issues/4)) ([5d13057](https://github.com/narapov/dependency-cruiser-json-viewer/commit/5d13057c4d2fa584ba4b891d42d5e26d4b862ec6))

## [1.1.0](https://github.com/narapov/dependency-cruiser-json-viewer/compare/v1.0.0...v1.1.0) (2026-08-03)

### Features

- save and load viewer workspace state ([#3](https://github.com/narapov/dependency-cruiser-json-viewer/issues/3)) ([3e03649](https://github.com/narapov/dependency-cruiser-json-viewer/commit/3e036498e95b6dbd7aec46c9ccbd35aead5c5a15))

## [1.0.0](https://github.com/narapov/dependency-cruiser-json-viewer/compare/v0.2.0...v1.0.0) (2026-08-02)

### Features

- add hidden items to DependencyPanel and show deps as tree ([0d74fe6](https://github.com/narapov/dependency-cruiser-json-viewer/commit/0d74fe6fb381ea9b4aeb004a266b7625c0fab2b8))
- add highlight edge from dependency panel ([5be9c34](https://github.com/narapov/dependency-cruiser-json-viewer/commit/5be9c34e31e3affea3fc3b324eb0e785fbf18447))
- add RelationList context menu and reveal actions on hover ([159e2d0](https://github.com/narapov/dependency-cruiser-json-viewer/commit/159e2d0e7f693db327317df0b399a403f6cb6e9a))
- export graph as .dot file ([f5aaff5](https://github.com/narapov/dependency-cruiser-json-viewer/commit/f5aaff5ab0772f077ce38e4d608a8253c77d9236))
- highlight minimap viewport ([d709ae4](https://github.com/narapov/dependency-cruiser-json-viewer/commit/d709ae49ac6e3263f710cd329739d9181bc1ba83))
- open graph DOT in Graphviz Online ([14503eb](https://github.com/narapov/dependency-cruiser-json-viewer/commit/14503ebdf72d28d501b8a749662fe8d78002994e))

### Bug Fixes

- accept cruise results without dependents and preserve parse causes ([17b1f92](https://github.com/narapov/dependency-cruiser-json-viewer/commit/17b1f92d8e538e8118fb724e212d6507fd6fc28d))
- defer graph focus until ELK layout applies the node ([72fce0e](https://github.com/narapov/dependency-cruiser-json-viewer/commit/72fce0e3d1702d071269cdd80148158d75df603f))
- focus graph node ([1c87790](https://github.com/narapov/dependency-cruiser-json-viewer/commit/1c877908c2dd61e05e2d0f61ccb9f2ddef7f6e49))
- incorrect types in tests ([d8a59cc](https://github.com/narapov/dependency-cruiser-json-viewer/commit/d8a59cc586e35dad8f61799fe012dc5a1a9ed2cc))
- race-safe loads, stricter cruise schema, and UI cleanup ([79e97cf](https://github.com/narapov/dependency-cruiser-json-viewer/commit/79e97cfc727f1c115c0a4b00dc14b1946ce9d7b2))

### Performance Improvements

- remove O(n²) subtree walk and path×pattern picomatch compiles ([c841735](https://github.com/narapov/dependency-cruiser-json-viewer/commit/c84173502b593f1efd27f0ab1cee7f4bf0ddc948))

## [0.2.0](https://github.com/narapov/dependency-cruiser-json-viewer/compare/v0.1.5...v0.2.0) (2026-07-31)

### Features

- add about app modal ([8fd64de](https://github.com/narapov/dependency-cruiser-json-viewer/commit/8fd64de1372817d0f8dbec7a70c7f4098a79ae79))
- replace dagre to elk ([#2](https://github.com/narapov/dependency-cruiser-json-viewer/issues/2)) ([c64f928](https://github.com/narapov/dependency-cruiser-json-viewer/commit/c64f92894857ec712a5dd5c5c3ef4b2c7aeb6850))

### Bug Fixes

- add environment to ICruiseResult in tests ([7cd9db3](https://github.com/narapov/dependency-cruiser-json-viewer/commit/7cd9db30b478dad013a629d5689bf1872d5f3f1d))

## [0.1.5](https://github.com/narapov/dependency-cruiser-json-viewer/compare/v0.1.4...v0.1.5) (2026-07-06)

## [0.1.4](https://github.com/narapov/dependency-cruiser-json-viewer/compare/v0.1.2...v0.1.4) (2026-07-06)

### Features

- add dnd for graph nodes ([edd997a](https://github.com/narapov/dependency-cruiser-json-viewer/commit/edd997afd0deee2d6cf43ac838f442b693cab535))
- add filetree and graph legend toggler and improve mobile layout ([8d57dee](https://github.com/narapov/dependency-cruiser-json-viewer/commit/8d57deea8e19b1d9acae265e37f114aeb73bacaa))
- show graph preview in minimap ([38b1c26](https://github.com/narapov/dependency-cruiser-json-viewer/commit/38b1c26f99820386f2f6cf3883b8a96b76b58228))

### Bug Fixes

- fix ts errors ([d00d632](https://github.com/narapov/dependency-cruiser-json-viewer/commit/d00d6325f03e5e20594853f013699154ea6f3bad))
- remove aggressive auto fitView ([64dbc10](https://github.com/narapov/dependency-cruiser-json-viewer/commit/64dbc1035a8ff67e899ba9e7be0769bfb7a4354f))

## [0.1.3](https://github.com/narapov/dependency-cruiser-json-viewer/compare/v0.1.2...v0.1.3) (2026-07-04)

### Features

- add dnd for graph nodes ([edd997a](https://github.com/narapov/dependency-cruiser-json-viewer/commit/edd997afd0deee2d6cf43ac838f442b693cab535))
- show graph preview in minimap ([38b1c26](https://github.com/narapov/dependency-cruiser-json-viewer/commit/38b1c26f99820386f2f6cf3883b8a96b76b58228))

### Bug Fixes

- remove aggressive auto fitView ([64dbc10](https://github.com/narapov/dependency-cruiser-json-viewer/commit/64dbc1035a8ff67e899ba9e7be0769bfb7a4354f))

## [0.1.2](https://github.com/narapov/dependency-cruiser-json-viewer/compare/v0.1.1...v0.1.2) (2026-06-30)

## 0.1.1 (2026-06-30)

### Features

- add AppStatusBar for activePath ([b08212a](https://github.com/narapov/dependency-cruiser-json-viewer/commit/b08212a8ce3ff84c13f632a80b4469cc64c32476))
- add cli ([f3cec5c](https://github.com/narapov/dependency-cruiser-json-viewer/commit/f3cec5c93e59e731aa8e7c9fcf5dc6bb6f374c86))
- add copy to context menu ([74cbe21](https://github.com/narapov/dependency-cruiser-json-viewer/commit/74cbe21e6d83ed0d07193dcf6f6565e15706afa7))
- add copy to view deps drawer and make text smaller ([1d8e82d](https://github.com/narapov/dependency-cruiser-json-viewer/commit/1d8e82d83c8cdaa34eab2e490d30db32a941a58b))
- add dark theme ([946e315](https://github.com/narapov/dependency-cruiser-json-viewer/commit/946e3151cd7b062fdb6edc06a2c6ed53de8b1ea6))
- add edge context menu and prevent default context menu on pane and expanded folder ([e1bd738](https://github.com/narapov/dependency-cruiser-json-viewer/commit/e1bd73889876cf8fde06072ebba84d21021aa81f))
- add edge selection ([f2e2485](https://github.com/narapov/dependency-cruiser-json-viewer/commit/f2e24855575fd9abebd920474313dc5de67045f9))
- add edge title ([a68fd7a](https://github.com/narapov/dependency-cruiser-json-viewer/commit/a68fd7a062c123664a8461e35e20ed074e684481))
- add expand recursive ([44050f0](https://github.com/narapov/dependency-cruiser-json-viewer/commit/44050f03915ff9635a7e9881f9620320f7494b6a))
- add file-tree ([2fb8f67](https://github.com/narapov/dependency-cruiser-json-viewer/commit/2fb8f67089dbaeec723ec5ba2044b33056fd07e9))
- add files icons ([71495a0](https://github.com/narapov/dependency-cruiser-json-viewer/commit/71495a092b86c62571d10c10003729d78901d277))
- add global ignore patterns ([fbe210e](https://github.com/narapov/dependency-cruiser-json-viewer/commit/fbe210eed48a48ae8583003c20d10572c62fb07c))
- add graph ([36f4451](https://github.com/narapov/dependency-cruiser-json-viewer/commit/36f4451d8581ae55abad49dda9a3ba3551915625))
- add graph folder colors ([ca300de](https://github.com/narapov/dependency-cruiser-json-viewer/commit/ca300dec8e261b78b53dda8711c98d94675c71af))
- add graph legend ([ac03cc3](https://github.com/narapov/dependency-cruiser-json-viewer/commit/ac03cc3233da69d3e15f10fe7899a056bb7abaf0))
- add i18n ([12d7c74](https://github.com/narapov/dependency-cruiser-json-viewer/commit/12d7c7454178c12f29a068687494c7e588148622))
- add minimap border ([b368e20](https://github.com/narapov/dependency-cruiser-json-viewer/commit/b368e2096c7e70b5da14e2cf6770dcd3a5797f0b))
- add open quick pick buttons ([cf3812b](https://github.com/narapov/dependency-cruiser-json-viewer/commit/cf3812b56654173a4c16d7603d35717016485be3))
- add quick open filter ([bf4ec0b](https://github.com/narapov/dependency-cruiser-json-viewer/commit/bf4ec0b9d437f6b96115e3a25dd2c64e8019d5a4))
- add quick pick and commands select ([1483762](https://github.com/narapov/dependency-cruiser-json-viewer/commit/1483762d697a3d743a8c94357e826700cb2d3053))
- add select all and expand all checkboxes and folder background ([0769940](https://github.com/narapov/dependency-cruiser-json-viewer/commit/0769940d522744d35cb98869fc3230be04ae3b94))
- add set theme command ([5055de1](https://github.com/narapov/dependency-cruiser-json-viewer/commit/5055de173bebfa547d6b33af6a429803b3845e6e))
- add sidebar resizer ([2aa6e19](https://github.com/narapov/dependency-cruiser-json-viewer/commit/2aa6e19905aa7505eb78d02aec8d7392701e113a))
- add spanish ([fa559a1](https://github.com/narapov/dependency-cruiser-json-viewer/commit/fa559a15bbfc873110d0325dd3ad6cc8e79173a1))
- add sticky to expanded tree items ([34ff300](https://github.com/narapov/dependency-cruiser-json-viewer/commit/34ff300c22cd18bfd087c7e2c473488798fcc080))
- add typeonly graph edges ([09ff7b4](https://github.com/narapov/dependency-cruiser-json-viewer/commit/09ff7b430e934fac0b50207770283ca21577d598))
- add view dependencies ([c9428d7](https://github.com/narapov/dependency-cruiser-json-viewer/commit/c9428d7ce0a32159461d8c03051233bc8f7cac30))
- custom tree insteadof antd ([27a9874](https://github.com/narapov/dependency-cruiser-json-viewer/commit/27a98744c885a57345a9167e2e26f221c5bcc854))
- exclude node_modules by default ([56d4038](https://github.com/narapov/dependency-cruiser-json-viewer/commit/56d40381d805b93676674bde3c0a0f406c88aa44))
- highlight edges ([ff27c6e](https://github.com/narapov/dependency-cruiser-json-viewer/commit/ff27c6e2824e6859db9963f1187a223d6a05cb08))
- improve graph layout ([efd7ec6](https://github.com/narapov/dependency-cruiser-json-viewer/commit/efd7ec6a672b8e57939f846abfa37c47ba7eeaa9))
- load cruise result json from file ([9481aff](https://github.com/narapov/dependency-cruiser-json-viewer/commit/9481aff4f8b2704d8f08892fb364ac5e09b4ce74))
- rename package to dependency-cruiser-json-viewer ([564b455](https://github.com/narapov/dependency-cruiser-json-viewer/commit/564b45579dc437f0f53cb354cd590b07acc76791))
- replace default enter behavior for filetree to show in graph action ([3b3aa32](https://github.com/narapov/dependency-cruiser-json-viewer/commit/3b3aa321cab3f019d6a4a5575b1bdcf5899a8a9c))
- scroll filetree ([dd9b833](https://github.com/narapov/dependency-cruiser-json-viewer/commit/dd9b8332eb65d49b4bf4f0a6bce0ab6a83e807a0))
- show circular deps ([c510df7](https://github.com/narapov/dependency-cruiser-json-viewer/commit/c510df726c30a7a751c6d6c254a7a6e7233639cb))
- show node from filetree and show half checked folders in graph ([c0006cd](https://github.com/narapov/dependency-cruiser-json-viewer/commit/c0006cdea619baba5d59a1d482756cf93d83a079))
- sync filetree and graph ([f8c66f5](https://github.com/narapov/dependency-cruiser-json-viewer/commit/f8c66f59f003ab949ec402e8d15172a76962c3c8))
- use panel instead of drawer for view dependencies ([676b549](https://github.com/narapov/dependency-cruiser-json-viewer/commit/676b5493e534a44ef0f28c43c3aea5449d5164cb))

### Bug Fixes

- change quick open input variant ([e4f3527](https://github.com/narapov/dependency-cruiser-json-viewer/commit/e4f3527909c16d271bae64a20610a025217034ee))
- fix react warnings in filetree ([dad32ad](https://github.com/narapov/dependency-cruiser-json-viewer/commit/dad32ad842a7f552179baa74fe630bfb6e434d3a))
- focus file tree node after item selection in QuickOpen ([1bb96db](https://github.com/narapov/dependency-cruiser-json-viewer/commit/1bb96db3eabedfd272ac23a63f0397ceb8417f5a))
- prevent default on filetree context menu ([c5f3f68](https://github.com/narapov/dependency-cruiser-json-viewer/commit/c5f3f6858759c7929c065e4ad6419aca8f4752fd))
- quickopen highlight name ([ce0718d](https://github.com/narapov/dependency-cruiser-json-viewer/commit/ce0718d81d4953df02ea77cd881fcb03155967ea))
- remove border-raduis for filetree item ([f34fc32](https://github.com/narapov/dependency-cruiser-json-viewer/commit/f34fc325e7884023ae46540c6c9789c1b8988bb5))
- tree overflow-x styles ([f68259b](https://github.com/narapov/dependency-cruiser-json-viewer/commit/f68259b927a209985978c7ea9be1fba1afe307ec))
- zoom to active element on collapse folder ([e2261f9](https://github.com/narapov/dependency-cruiser-json-viewer/commit/e2261f9b7f6a714e0653bf193f515b4039b601e6))
