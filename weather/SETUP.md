# Weather App - Setup Guide

## 项目概述

这是一个基于 React Native 和 Expo 开发的跨平台天气应用，支持 iOS 和 Android 平台。

### 主要功能
- ✅ 获取当前位置天气
- ✅ 城市搜索功能
- ✅ 未来7天天气预报
- ✅ 天气动画效果
- ✅ 离线缓存功能

## 环境要求

- Node.js 16+ 
- npm 或 yarn
- Expo CLI (可选)
- iOS: Xcode (仅限 macOS)
- Android: Android Studio

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

或者使用 yarn：

```bash
yarn install
```

### 2. 配置 API 密钥

应用使用 OpenWeatherMap API 获取天气数据，需要配置 API 密钥：

#### 方法一：修改 app.json

打开 `app.json` 文件，找到 `extra` 部分：

```json
"extra": {
  "weatherApiKey": "YOUR_API_KEY_HERE"
}
```

将 `YOUR_API_KEY_HERE` 替换为你的 OpenWeatherMap API 密钥。

#### 方法二：使用环境变量（推荐）

创建 `.env` 文件：

```
WEATHER_API_KEY=your_api_key_here
```

### 3. 获取 OpenWeatherMap API 密钥

1. 访问 [OpenWeatherMap 官网](https://openweathermap.org/)
2. 注册一个免费账户
3. 登录后，进入 "My API keys" 页面
4. 复制你的 API 密钥
5. 将密钥配置到应用中

**注意**: 免费 tier 有调用次数限制，请合理使用。

## 运行应用

### 使用 Expo Go（推荐，最简单）

1. 在你的移动设备上安装 Expo Go 应用
   - iOS: App Store 搜索 "Expo Go"
   - Android: Google Play 搜索 "Expo Go"

2. 启动开发服务器：
   ```bash
   npm start
   ```

3. 使用 Expo Go 扫描终端显示的二维码
   - iOS: 使用相机扫描
   - Android: 在 Expo Go 应用内扫描

### 使用模拟器/模拟器

#### iOS 模拟器（仅限 macOS）

```bash
npm run ios
```

#### Android 模拟器

```bash
npm run android
```

### Web 版本

```bash
npm run web
```

## 项目结构

```
weather-app/
├── assets/                    # 静态资源
│   └── animations/           # 天气动画文件
├── spec/                      # 技术规格文档
├── src/                       # 源代码
│   ├── components/           # 可复用组件
│   │   ├── search/           # 搜索相关组件
│   │   └── weather/          # 天气相关组件
│   ├── constants/            # 常量定义
│   ├── context/              # 状态管理 (React Context)
│   ├── hooks/                # 自定义 Hooks
│   ├── navigation/           # 导航配置
│   ├── screens/              # 页面组件
│   ├── services/             # 服务层
│   │   ├── api/              # API 服务
│   │   ├── location/         # 位置服务
│   │   └── storage/          # 缓存存储
│   ├── styles/               # 全局样式
│   └── utils/                # 工具函数
├── App.js                     # 应用入口
├── app.json                   # Expo 配置
├── babel.config.js            # Babel 配置
├── package.json               # 依赖配置
└── SETUP.md                   # 本说明文件
```

## 核心功能说明

### 1. 当前位置天气获取

- 应用启动时自动请求位置权限
- 使用 `expo-location` 获取当前位置
- 实时更新天气数据
- 支持下拉刷新

### 2. 城市搜索

- 支持实时搜索建议
- 显示搜索历史记录
- 点击搜索结果直接查看天气
- 搜索防抖处理优化性能

### 3. 7天天气预报

- 水平滑动查看不同日期
- 显示每天最高/最低温度
- 天气状况描述和图标
- 详细天气信息（湿度、风速等）

### 4. 天气动画效果

- 根据天气状况显示对应动画
- 支持多种天气类型：
  - ☀️ 晴天
  - ☁️ 多云
  - 🌧️ 雨天
  - ⛈️ 雷暴
  - ❄️ 雪天
  - 🌫️ 雾天
- 使用 Lottie 实现高性能动画

### 5. 离线缓存

- 自动缓存最近查看的天气数据
- 缓存有效期：1小时
- 无网络时自动使用缓存数据
- 支持手动清除缓存

## 技术栈

- **框架**: React Native 0.74+
- **开发工具**: Expo SDK 51
- **状态管理**: React Context
- **导航**: React Navigation 6.x
- **HTTP 客户端**: Axios
- **本地存储**: AsyncStorage
- **动画**: Lottie React Native
- **位置服务**: Expo Location

## 🔧 修复记录

### 已修复的问题（2026-04-28）

#### 1. API 密钥读取问题
**问题**：原代码使用 `process.env.WEATHER_API_KEY` 读取 API 密钥，但在 Expo 项目中应该使用 `expo-constants` 来读取 `app.json` 中的配置。

**修复**：
- 添加了 `expo-constants` 依赖
- 修改了 `src/constants/apiConfig.js`，使用 `Constants.expoConfig?.extra` 来读取配置
- 增加了错误提示，如果 API 密钥未配置，会在控制台显示警告

#### 2. 位置获取问题
**问题**：即使有定位权限，依然获取不到经纬度。

**根本原因**：
1. `LocationContext` 中的 `requestPermissions` 函数没有返回获取到的位置数据
2. `HomeScreen.js` 中的 `initializeApp` 函数依赖 `location` 状态变量来判断是否加载天气数据，但 React 状态更新是异步的，所以即使 `requestPermissions` 内部获取了位置，`location` 变量在当前闭包中仍然是 `null`

**修复**：
1. **修改了 `src/context/LocationContext.js`**：
   - 重构了位置获取逻辑，将 `getCurrentLocation` 拆分为内部函数 `getCurrentLocationInternal`
   - 修改了 `requestPermissions` 函数，使其返回获取到的位置数据：`{ ...result, location: locationResult }`
   - 修复了 `useCallback` 的依赖数组问题

2. **修改了 `src/screens/HomeScreen.js`**：
   - 添加了 `hasInitialized` 状态，防止重复初始化
   - 修改了 `initializeApp` 函数，直接使用 `requestPermissions` 返回的 `location` 数据，而不是依赖状态变量
   - 添加了新的 `useEffect`，监听 `location` 状态变化，当位置可用时自动加载天气数据
   - 修改了 `handlePermissionGrant` 函数，确保权限授予后能正确获取位置和天气数据

#### 3. 动画效果问题
**问题**：天气动画效果没有呈现出来。

**根本原因**：
- 我们创建的 Lottie 动画文件（`assets/animations/*.json`）是简单的占位文件，不是真正的 Lottie 动画格式
- Lottie 动画需要从 Adobe After Effects 导出的特定 Bodymovin JSON 格式

**修复**：
1. **重构了 `src/components/weather/WeatherAnimation.js`**：
   - 创建了 `WeatherEmoji` 组件作为备用方案，使用天气 emoji 配合 `react-native-reanimated` 实现动画效果
   - 为不同天气类型设置了不同的 emoji：
     - ☀️ 晴天 (旋转动画)
     - ☁️ 多云
     - 🌧️ 雨天
     - ⛈️ 雷暴
     - ❄️ 雪天
     - 🌫️ 雾天
   - 添加了淡入动画和旋转动画（晴天图标会旋转）

   - 改进了 `WeatherAnimation` 组件：
     - 添加了错误处理，如果 Lottie 动画加载失败，自动切换到 emoji 动画
     - 添加了加载状态，在 Lottie 动画加载期间显示 emoji 作为占位
     - 添加了控制台日志，帮助调试动画问题

#### 4. 变量名冲突问题
**问题**：在 `HomeScreen.js` 中，`colors` 变量被定义了两次：
- 一次是从 `styles/colors` 导入的
- 另一次是在 `useEffect` 中定义的

**修复**：将 `useEffect` 中的变量名从 `colors` 改为 `bgColorsArray`，避免了命名冲突。

#### 5. 资源文件路径问题
**问题**：`app.json` 中引用的资源文件路径不正确，有些文件不存在。

**修复**：
- 更新了 `app.json` 中的资源文件路径
- 将启动画面背景色改为天气主题色 `#87CEEB`

---

## 常见问题

### Q1: 为什么天气数据加载不出来？

**可能原因**:
1. API 密钥未配置或无效
2. 网络连接问题
3. 位置权限未授权

**解决方法**:
1. 检查 `app.json` 中的 API 密钥配置
2. 确保设备有网络连接
3. 检查应用的位置权限设置

### Q2: 如何更改温度单位？

当前默认使用摄氏度（°C）。如需更改，请修改 `src/constants/apiConfig.js` 中的 `UNITS` 配置：

```javascript
UNITS: 'metric',  // 摄氏度
// 或
UNITS: 'imperial', // 华氏度
```

### Q3: 缓存有效期如何修改？

修改 `src/services/storage/cacheStorage.js` 中的 `DEFAULT_EXPIRY`：

```javascript
const DEFAULT_EXPIRY = 60 * 60 * 1000; // 1小时（毫秒）
```

### Q4: 如何添加更多天气动画？

1. 从 [LottieFiles](https://lottiefiles.com/) 下载动画 JSON 文件
2. 将文件放入 `assets/animations/` 目录
3. 在 `src/constants/weatherTypes.js` 中添加映射关系

## 调试技巧

### 查看 console 日志

在终端运行应用时，可以看到所有的 `console.log` 输出。

### 使用 Expo DevTools

启动应用后，按 `d` 键打开 Expo DevTools，可以：
- 查看元素结构
- 检查网络请求
- 查看性能指标
- 热重载应用

### 清除缓存

如果遇到奇怪的问题，尝试清除缓存：

```bash
npm start -- --clear
```

## 部署发布

### 构建 Android APK/AAB

```bash
npx expo build:android
```

### 构建 iOS IPA

```bash
npx expo build:ios
```

### OTA 更新（推荐）

无需重新提交应用商店，直接更新：

```bash
npx expo publish
```

## 贡献指南

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目仅供学习和参考使用。

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

---

**享受使用 Weather App！** ☀️🌤️⛅🌧️
