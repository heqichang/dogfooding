# React Native 天气应用技术规格文档

## 1. 项目概述

### 1.1 项目目标
开发一个基于 React Native 的跨平台天气应用，支持 iOS 和 Android 平台，提供实时天气信息、城市搜索、7天天气预报、天气动画效果和离线缓存功能。

### 1.2 目标用户
普通用户，需要快速获取天气信息的人群

### 1.3 开发环境
- **操作系统**: Windows 10/11 或 macOS
- **开发框架**: Expo SDK 49+
- **目标平台**: iOS 13.0+ / Android 5.0+ (API 21+)

## 2. 功能需求

### 2.1 核心功能模块

#### 2.1.1 当前位置天气获取
- **功能描述**: 获取用户当前位置的实时天气信息
- **输入**: 用户位置权限授权
- **输出**: 当前位置的天气信息（温度、湿度、风速、天气状况等）
- **业务规则**:
  - 首次启动时请求位置权限
  - 位置权限拒绝时提示用户手动输入城市
  - 支持位置刷新功能
  - 显示获取位置的加载状态

#### 2.1.2 城市搜索
- **功能描述**: 允许用户搜索全球城市并查看其天气信息
- **输入**: 城市名称关键词
- **输出**: 匹配的城市列表
- **业务规则**:
  - 支持实时搜索建议
  - 搜索历史记录保存
  - 支持拼音搜索（如适用）
  - 搜索结果分页显示

#### 2.1.3 未来7天天气预报
- **功能描述**: 显示未来7天的天气预报信息
- **输入**: 当前位置或搜索到的城市
- **输出**: 未来7天的详细天气预报（最高/最低温度、天气状况、降水概率等）
- **业务规则**:
  - 支持横向滑动查看不同日期
  - 显示温度趋势图
  - 标注特殊天气（如雨天、雪天等）

#### 2.1.4 天气动画效果
- **功能描述**: 根据不同天气状况显示相应的动画效果
- **输入**: 天气状况数据（晴天、雨天、雪天等）
- **输出**: 对应的动画效果
- **业务规则**:
  - 支持多种天气类型动画（晴天、多云、雨天、雪天、雷暴等）
  - 动画效果流畅，性能良好
  - 动画与背景颜色相匹配

#### 2.1.5 离线缓存
- **功能描述**: 缓存天气数据，支持离线查看
- **输入**: 从API获取的天气数据
- **输出**: 本地缓存的天气数据
- **业务规则**:
  - 自动缓存最近查看的天气数据
  - 设置缓存过期时间（如1小时）
  - 无网络时自动使用缓存数据
  - 支持手动清除缓存

### 2.2 非功能需求

#### 2.2.1 性能要求
- 应用启动时间 < 3秒
- 页面切换流畅，帧率 > 60fps
- 动画效果流畅，无卡顿

#### 2.2.2 用户体验
- 界面简洁美观，符合现代移动应用设计规范
- 操作流程简单直观
- 错误提示友好，帮助用户解决问题

#### 2.2.3 兼容性
- 支持 iOS 13.0+
- 支持 Android 5.0+ (API 21+)
- 适配不同屏幕尺寸

## 3. 技术架构

### 3.1 整体架构

采用分层架构设计，主要分为以下几层：

1. **表现层 (Presentation Layer)**: 负责UI展示和用户交互
2. **业务逻辑层 (Business Logic Layer)**: 处理业务逻辑和状态管理
3. **数据层 (Data Layer)**: 负责数据获取和缓存管理

### 3.2 数据流设计

```
用户交互 -> UI组件 -> 状态管理 -> 服务层 -> API/缓存
                                      ↓
UI更新 <- 状态更新 <- 数据处理 <- 响应数据
```

## 4. 目录结构

```
weather-app/
├── .expo/                    # Expo配置目录
├── assets/                   # 静态资源目录
│   ├── animations/           # 动画文件
│   ├── fonts/                # 字体文件
│   └── images/               # 图片文件
├── src/                      # 源代码目录
│   ├── components/           # 可复用组件
│   │   ├── common/           # 通用组件（按钮、输入框等）
│   │   ├── weather/          # 天气相关组件
│   │   │   ├── CurrentWeather.js
│   │   │   ├── DailyForecast.js
│   │   │   ├── HourlyForecast.js
│   │   │   └── WeatherAnimation.js
│   │   └── search/           # 搜索相关组件
│   │       ├── SearchBar.js
│   │       └── SearchResultList.js
│   ├── screens/              # 页面组件
│   │   ├── HomeScreen.js     # 首页（当前位置天气）
│   │   ├── SearchScreen.js   # 搜索页面
│   │   └── ForecastScreen.js # 详细预报页面
│   ├── services/             # 服务层
│   │   ├── api/              # API服务
│   │   │   ├── weatherApi.js # 天气API调用
│   │   │   └── locationApi.js # 位置相关API
│   │   ├── storage/          # 本地存储服务
│   │   │   └── cacheStorage.js # 缓存存储
│   │   └── location/         # 位置服务
│   │       └── locationService.js # 位置获取服务
│   ├── context/              # 状态管理（React Context）
│   │   ├── WeatherContext.js # 天气状态上下文
│   │   └── LocationContext.js # 位置状态上下文
│   ├── hooks/                # 自定义Hooks
│   │   ├── useWeather.js     # 天气相关Hooks
│   │   ├── useLocation.js    # 位置相关Hooks
│   │   └── useSearch.js      # 搜索相关Hooks
│   ├── utils/                # 工具函数
│   │   ├── dateUtils.js      # 日期处理工具
│   │   ├── weatherUtils.js   # 天气数据处理工具
│   │   └── unitsUtils.js     # 单位转换工具
│   ├── constants/            # 常量定义
│   │   ├── weatherTypes.js   # 天气类型常量
│   │   └── apiConfig.js      # API配置常量
│   ├── styles/               # 全局样式
│   │   ├── colors.js         # 颜色定义
│   │   ├── typography.js     # 字体样式
│   │   └── spacing.js        # 间距定义
│   └── App.js                # 应用入口文件
├── app.json                  # Expo配置文件
├── babel.config.js           # Babel配置
├── package.json              # 依赖配置
└── README.md                 # 项目说明
```

## 5. 技术选型

### 5.1 核心技术栈

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React Native | 0.72+ | 跨平台移动开发框架 | 行业标准，社区活跃，生态丰富 |
| Expo | SDK 49+ | 开发和构建工具 | 简化开发流程，无需原生环境配置，提供丰富的API |
| React Navigation | 6.x | 页面导航 | 官方推荐，功能强大，支持多种导航模式 |
| Axios | 1.x | HTTP客户端 | 简洁易用，支持拦截器，广泛使用 |
| AsyncStorage | 1.x | 本地存储 | Expo推荐，简单易用，适合存储小量数据 |
| React Native Reanimated | 3.x | 动画库 | 高性能动画，支持原生驱动动画 |
| Lottie React Native | 6.x | 动画效果 | 支持Adobe After Effects导出的动画，效果丰富 |
| Expo Location | ~16.x | 位置服务 | Expo官方提供，简化位置权限和获取流程 |

### 5.2 天气API选择

选择 **OpenWeatherMap API** 作为天气数据来源，理由如下：
- 免费 tier 提供足够的功能（当前天气、5天预报、城市搜索）
- API 文档详细，社区支持好
- 支持全球城市数据
- 响应格式为 JSON，易于解析

**API 端点**:
- 当前天气: `https://api.openweathermap.org/data/2.5/weather`
- 5天预报: `https://api.openweathermap.org/data/2.5/forecast`
- 城市搜索: `https://api.openweathermap.org/geo/1.0/direct`

## 6. 核心功能实现方案

### 6.1 当前位置天气获取

#### 实现流程
1. **权限请求**: 应用启动时，使用 `expo-location` 请求位置权限
2. **位置获取**: 权限授权后，获取当前位置的经纬度
3. **API调用**: 使用经纬度调用 OpenWeatherMap API 获取当前天气
4. **数据处理**: 处理 API 响应数据，转换为应用内部格式
5. **UI更新**: 更新 UI 显示当前天气信息

#### 关键代码实现
```javascript
// hooks/useLocation.js
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      } catch (error) {
        setErrorMsg('Failed to get current location');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { location, errorMsg, loading };
};
```

### 6.2 城市搜索

#### 实现流程
1. **输入监听**: 监听用户在搜索框中的输入
2. **防抖处理**: 对输入进行防抖处理，避免频繁调用 API
3. **API调用**: 使用输入关键词调用 OpenWeatherMap 地理编码 API
4. **结果展示**: 显示匹配的城市列表
5. **选择处理**: 用户选择城市后，获取该城市的天气信息

#### 关键代码实现
```javascript
// hooks/useSearch.js
import { useState, useEffect, useCallback } from 'react';
import { searchCities } from '../services/api/weatherApi';

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await searchCities(query);
        setSearchResults(results);
      } catch (err) {
        setError('Failed to search cities');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    error
  };
};

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

### 6.3 未来7天天气预报

#### 实现流程
1. **数据获取**: 调用 OpenWeatherMap 5天预报 API
2. **数据处理**: 解析 API 响应，按日期分组，计算每天的最高/最低温度
3. **UI展示**: 以水平列表形式展示未来几天的天气预报
4. **详情查看**: 用户点击某一天时，显示该天的详细预报信息

#### 关键代码实现
```javascript
// utils/weatherUtils.js
export const processForecastData = (forecastData) => {
  // 按日期分组
  const dailyForecasts = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toDateString();
    
    if (!dailyForecasts[dateKey]) {
      dailyForecasts[dateKey] = {
        date,
        temps: [],
        weatherConditions: [],
        humidity: [],
        windSpeed: []
      };
    }
    
    dailyForecasts[dateKey].temps.push(item.main.temp);
    dailyForecasts[dateKey].weatherConditions.push(item.weather[0]);
    dailyForecasts[dateKey].humidity.push(item.main.humidity);
    dailyForecasts[dateKey].windSpeed.push(item.wind.speed);
  });
  
  // 转换为数组并计算每天的统计值
  return Object.values(dailyForecasts).map(day => ({
    date: day.date,
    dayOfWeek: day.date.toLocaleDateString('en-US', { weekday: 'short' }),
    dateStr: day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tempMax: Math.max(...day.temps),
    tempMin: Math.min(...day.temps),
    weather: getMostCommonWeather(day.weatherConditions),
    avgHumidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
    avgWindSpeed: (day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length).toFixed(1)
  }));
};

const getMostCommonWeather = (conditions) => {
  const weatherCounts = {};
  conditions.forEach(condition => {
    const main = condition.main;
    weatherCounts[main] = (weatherCounts[main] || 0) + 1;
  });
  
  let maxCount = 0;
  let mostCommon = conditions[0];
  Object.entries(weatherCounts).forEach(([main, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = conditions.find(c => c.main === main);
    }
  });
  
  return mostCommon;
};
```

### 6.4 天气动画效果

#### 实现方案
使用 **Lottie** 动画库实现天气动画效果，理由：
- 动画效果丰富，支持多种天气场景
- 性能良好，使用原生渲染
- 社区有大量现成的天气动画资源

#### 实现流程
1. **动画准备**: 准备不同天气类型的 Lottie 动画文件
2. **动画映射**: 创建天气类型到动画文件的映射关系
3. **动画渲染**: 根据当前天气类型渲染对应的动画
4. **性能优化**: 合理控制动画播放，避免不必要的性能消耗

#### 关键代码实现
```javascript
// components/weather/WeatherAnimation.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { WEATHER_ANIMATIONS } from '../../constants/weatherTypes';

const WeatherAnimation = ({ weatherType, style }) => {
  const animationSource = WEATHER_ANIMATIONS[weatherType] || WEATHER_ANIMATIONS.default;

  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={animationSource}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

export default WeatherAnimation;

// constants/weatherTypes.js
export const WEATHER_TYPES = {
  CLEAR: 'Clear',
  CLOUDS: 'Clouds',
  RAIN: 'Rain',
  DRIZZLE: 'Drizzle',
  THUNDERSTORM: 'Thunderstorm',
  SNOW: 'Snow',
  MIST: 'Mist',
  FOG: 'Fog',
  HAZE: 'Haze',
};

export const WEATHER_ANIMATIONS = {
  [WEATHER_TYPES.CLEAR]: require('../../assets/animations/sunny.json'),
  [WEATHER_TYPES.CLOUDS]: require('../../assets/animations/cloudy.json'),
  [WEATHER_TYPES.RAIN]: require('../../assets/animations/rainy.json'),
  [WEATHER_TYPES.DRIZZLE]: require('../../assets/animations/rainy.json'),
  [WEATHER_TYPES.THUNDERSTORM]: require('../../assets/animations/thunderstorm.json'),
  [WEATHER_TYPES.SNOW]: require('../../assets/animations/snowy.json'),
  [WEATHER_TYPES.MIST]: require('../../assets/animations/foggy.json'),
  [WEATHER_TYPES.FOG]: require('../../assets/animations/foggy.json'),
  [WEATHER_TYPES.HAZE]: require('../../assets/animations/foggy.json'),
  default: require('../../assets/animations/sunny.json'),
};
```

### 6.5 离线缓存

#### 实现方案
使用 **AsyncStorage** 实现离线缓存功能，策略如下：
- 缓存最近查看的城市天气数据
- 设置缓存过期时间（默认1小时）
- 无网络时自动使用缓存数据
- 提供手动清除缓存功能

#### 实现流程
1. **缓存存储**: 获取到新数据时，同时保存到本地缓存
2. **缓存读取**: 无网络或数据过期时，从缓存读取数据
3. **缓存过期检查**: 读取缓存时检查是否过期
4. **缓存管理**: 提供清除缓存和查看缓存大小的功能

#### 关键代码实现
```javascript
// services/storage/cacheStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@weather_cache_';
const DEFAULT_EXPIRY = 60 * 60 * 1000; // 1小时

export const cacheStorage = {
  async set(key, data, expiry = DEFAULT_EXPIRY) {
    try {
      const item = {
        data,
        expiry: Date.now() + expiry,
      };
      await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to set cache:', error);
    }
  },

  async get(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
      if (jsonValue === null) {
        return null;
      }

      const item = JSON.parse(jsonValue);
      
      // 检查是否过期
      if (Date.now() > item.expiry) {
        await this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.error('Failed to remove cache:', error);
    }
  },

  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  },

  async getCacheSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      let size = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          size += value.length;
        }
      }
      
      return size;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }
};

// 缓存键生成器
export const generateCacheKey = (type, params) => {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `${type}?${sortedParams}`;
};
```

## 7. 边界情况和异常处理

### 7.1 位置服务异常

**场景**:
1. 用户拒绝位置权限
2. 位置服务不可用
3. 获取位置超时

**处理策略**:
1. 权限拒绝时，显示友好提示，引导用户手动搜索城市
2. 提供手动输入城市的备选方案
3. 位置获取超时，显示加载失败提示，提供重试按钮

**代码实现思路**:
```javascript
// 在 useLocation hook 中
const [errorMsg, setErrorMsg] = useState(null);

// 权限检查
let { status } = await Location.requestForegroundPermissionsAsync();
if (status !== 'granted') {
  setErrorMsg('Location permission denied. Please search for a city manually.');
  return;
}

// 超时处理
try {
  let location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    timeout: 10000, // 10秒超时
  });
  setLocation(location);
} catch (error) {
  if (error.code === 'TIMEOUT') {
    setErrorMsg('Location request timed out. Please try again or search for a city.');
  } else {
    setErrorMsg('Failed to get location. Please try again or search for a city.');
  }
}
```

### 7.2 网络连接异常

**场景**:
1. 无网络连接
2. 网络连接不稳定
3. API 请求超时

**处理策略**:
1. 检测网络状态，无网络时显示离线状态
2. 无网络时，自动使用缓存数据（如果有）
3. 网络不稳定时，显示加载状态，提供重试按钮
4. 请求超时，显示友好错误提示

**代码实现思路**:
```javascript
// 使用 NetInfo 检测网络状态
import NetInfo from '@react-native-community/netinfo';

// 在 API 服务中添加网络检查
const fetchWithNetworkCheck = async (url, options) => {
  const netInfo = await NetInfo.fetch();
  
  if (!netInfo.isConnected) {
    // 无网络，尝试使用缓存
    const cachedData = await cacheStorage.get(generateCacheKey('weather', { lat, lon }));
    if (cachedData) {
      return { data: cachedData, fromCache: true };
    }
    throw new Error('No internet connection and no cached data available');
  }

  // 有网络，正常请求
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return { data, fromCache: false };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
};
```

### 7.3 API 请求异常

**场景**:
1. API 密钥无效或过期
2. 请求参数错误
3. API 服务不可用
4. 超出 API 调用限制

**处理策略**:
1. API 密钥问题，显示错误提示，引导用户检查配置
2. 参数错误，记录日志，避免向用户显示技术细节
3. API 服务不可用，显示服务维护提示，提供重试按钮
4. 超出调用限制，显示友好提示，建议稍后再试

**代码实现思路**:
```javascript
// 在 API 服务中添加错误处理
export const fetchWeather = async (lat, lon) => {
  try {
    const response = await axios.get(WEATHER_API_ENDPOINTS.CURRENT, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units: 'metric',
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401:
          throw new Error('Invalid API key. Please check your configuration.');
        case 404:
          throw new Error('Location not found. Please try a different location.');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Weather service is temporarily unavailable. Please try again later.');
        default:
          throw new Error('Failed to fetch weather data. Please try again.');
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      throw new Error('No response from server. Please check your network connection.');
    } else {
      // 请求配置错误
      throw new Error('Failed to fetch weather data. Please try again.');
    }
  }
};
```

### 7.4 缓存操作异常

**场景**:
1. 缓存读取失败
2. 缓存写入失败
3. 缓存数据格式错误

**处理策略**:
1. 缓存操作失败时，记录日志，不影响主要功能
2. 缓存数据格式错误时，清除该缓存项
3. 缓存空间不足时，自动清理过期缓存

**代码实现思路**:
```javascript
// 在 cacheStorage 中添加错误处理
export const cacheStorage = {
  async get(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
      if (jsonValue === null) {
        return null;
      }

      const item = JSON.parse(jsonValue);
      
      // 检查是否过期
      if (Date.now() > item.expiry) {
        await this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Failed to get cache:', error);
      
      // 如果是解析错误，清除该缓存
      if (error instanceof SyntaxError) {
        try {
          await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
        } catch (removeError) {
          console.error('Failed to remove corrupted cache:', removeError);
        }
      }
      
      return null;
    }
  },

  async set(key, data, expiry = DEFAULT_EXPIRY) {
    try {
      const item = {
        data,
        expiry: Date.now() + expiry,
      };
      await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to set cache:', error);
      
      // 如果是存储空间不足，尝试清理过期缓存
      if (error.message.includes('No space left') || error.code === '12') {
        try {
          await this.clearExpired();
        } catch (clearError) {
          console.error('Failed to clear expired cache:', clearError);
        }
      }
    }
  },

  async clearExpired() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      for (const key of cacheKeys) {
        try {
          const jsonValue = await AsyncStorage.getItem(key);
          if (jsonValue) {
            const item = JSON.parse(jsonValue);
            if (Date.now() > item.expiry) {
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          // 单个缓存项处理失败，继续处理其他项
          console.error(`Failed to process cache key ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }
};
```

### 7.5 用户权限拒绝

**场景**:
1. 用户拒绝位置权限
2. 用户拒绝通知权限（如果有）

**处理策略**:
1. 权限拒绝时，显示友好提示，解释权限用途
2. 提供手动输入的备选方案
3. 引导用户到系统设置中开启权限（如果需要）

**代码实现思路**:
```javascript
// 在权限请求组件中
const requestLocationPermission = async () => {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  
  if (status === 'granted') {
    // 权限已授权
    setLocationPermissionGranted(true);
    return;
  }

  if (status === 'denied') {
    if (canAskAgain) {
      // 可以再次请求，显示解释对话框
      setShowPermissionExplanation(true);
    } else {
      // 用户永久拒绝，引导到设置
      setShowPermissionSettingsGuide(true);
    }
  }
};

// 解释权限用途的对话框
const PermissionExplanationModal = ({ visible, onRequestClose, onAllow }) => {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Location Permission Needed</Text>
          <Text style={styles.modalDescription}>
            We need your location to show you accurate weather information for your current area. 
            You can also search for cities manually if you prefer.
          </Text>
          <View style={styles.modalButtons}>
            <Button title="Not Now" onPress={onRequestClose} />
            <Button title="Allow Access" onPress={onAllow} />
          </View>
        </View>
      </View>
    </Modal>
  );
};
```

## 8. 性能优化

### 8.1 内存优化

1. **组件卸载时清理**:
   - 取消未完成的 API 请求
   - 移除事件监听器
   - 停止动画

2. **图片优化**:
   - 使用适当分辨率的图片
   - 实现图片缓存
   - 及时释放图片资源

3. **列表优化**:
   - 使用 `FlatList` 的 `removeClippedSubviews` 属性
   - 实现 `keyExtractor` 确保唯一 key
   - 使用 `getItemLayout` 优化列表性能

### 8.2 网络优化

1. **请求优化**:
   - 实现请求防抖和节流
   - 使用缓存减少重复请求
   - 实现请求取消机制

2. **数据传输优化**:
   - 使用压缩格式（如 gzip）
   - 只请求需要的数据字段
   - 实现数据增量更新

### 8.3 动画优化

1. **使用原生驱动动画**:
   - 使用 `useNativeDriver: true`
   - 避免在 JS 线程执行复杂动画

2. **动画管理**:
   - 组件不可见时暂停动画
   - 合理控制动画数量
   - 使用简单的动画效果

## 9. 安全考虑

### 9.1 API 密钥保护

**问题**:
- 直接在代码中硬编码 API 密钥容易被反编译获取
- 密钥泄露可能导致 API 被滥用

**解决方案**:
1. **环境变量管理**:
   - 使用 `react-native-config` 或 `expo-constants` 管理环境变量
   - 不同环境（开发、生产）使用不同的密钥

2. **密钥混淆**:
   - 对密钥进行简单的混淆处理
   - 运行时动态构建密钥

3. **后端代理**:
   - 通过自己的后端服务代理 API 请求
   - 密钥只存储在后端，不暴露在客户端

**代码实现思路**:
```javascript
// 使用 expo-constants 管理配置
import Constants from 'expo-constants';

// app.json 中配置 extra 字段
// "extra": {
//   "weatherApiKey": "your_api_key_here"
// }

const API_KEY = Constants.expoConfig.extra.weatherApiKey;

// 或者使用环境变量（需要配置 babel-plugin-transform-inline-environment-variables）
// const API_KEY = process.env.WEATHER_API_KEY;
```

### 9.2 数据传输安全

**问题**:
- 敏感数据在网络传输过程中可能被截获
- 中间人攻击风险

**解决方案**:
1. **使用 HTTPS**:
   - 所有 API 请求都使用 HTTPS
   - 验证服务器证书

2. **证书锁定**:
   - 实现证书锁定，防止中间人攻击
   - 使用 `react-native-ssl-pinning` 库

3. **敏感数据加密**:
   - 敏感数据传输前进行加密
   - 使用安全的加密算法

### 9.3 本地数据安全

**问题**:
- 本地存储的数据可能被恶意应用访问
- 敏感信息泄露风险

**解决方案**:
1. **使用安全存储**:
   - 对于敏感数据，使用 `expo-secure-store` 而不是 `AsyncStorage`
   - 密钥链存储（iOS）和 Keystore（Android）

2. **数据加密**:
   - 对本地存储的敏感数据进行加密
   - 使用安全的加密算法（AES-256）

3. **数据清理**:
   - 应用卸载时自动清理所有数据
   - 提供手动清除数据功能

## 10. 测试策略

### 10.1 单元测试

**测试范围**:
- 工具函数
- 自定义 Hooks
- 业务逻辑函数

**测试工具**:
- Jest: 测试框架
- React Hooks Testing Library: 测试自定义 Hooks

**示例测试**:
```javascript
// utils/__tests__/weatherUtils.test.js
import { processForecastData, getMostCommonWeather } from '../weatherUtils';

describe('weatherUtils', () => {
  describe('getMostCommonWeather', () => {
    it('should return the most common weather condition', () => {
      const conditions = [
        { main: 'Rain', description: 'light rain' },
        { main: 'Rain', description: 'moderate rain' },
        { main: 'Clouds', description: 'overcast clouds' },
      ];

      const result = getMostCommonWeather(conditions);
      expect(result.main).toBe('Rain');
    });

    it('should return the first condition if all are equally common', () => {
      const conditions = [
        { main: 'Sunny', description: 'clear sky' },
        { main: 'Cloudy', description: 'few clouds' },
      ];

      const result = getMostCommonWeather(conditions);
      expect(result.main).toBe('Sunny');
    });
  });

  describe('processForecastData', () => {
    it('should process forecast data correctly', () => {
      const mockForecastData = {
        list: [
          {
            dt: 1699000000,
            main: { temp: 20, humidity: 50 },
            weather: [{ main: 'Sunny', description: 'clear sky' }],
            wind: { speed: 3.5 }
          },
          {
            dt: 1699086400,
            main: { temp: 25, humidity: 40 },
            weather: [{ main: 'Sunny', description: 'clear sky' }],
            wind: { speed: 4.2 }
          }
        ]
      };

      const result = processForecastData(mockForecastData);
      expect(result).toHaveLength(1);
      expect(result[0].tempMax).toBe(25);
      expect(result[0].tempMin).toBe(20);
      expect(result[0].weather.main).toBe('Sunny');
    });
  });
});
```

### 10.2 组件测试

**测试范围**:
- UI 组件的渲染
- 用户交互行为
- 组件状态变化

**测试工具**:
- React Native Testing Library: 测试 React Native 组件
- Jest: 测试框架

**示例测试**:
```javascript
// components/weather/__tests__/CurrentWeather.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CurrentWeather from '../CurrentWeather';

describe('CurrentWeather', () => {
  const mockWeatherData = {
    name: 'Beijing',
    main: { temp: 20, feels_like: 18, humidity: 50 },
    weather: [{ main: 'Sunny', description: 'clear sky', icon: '01d' }],
    wind: { speed: 3.5 },
    sys: { sunrise: 1698970000, sunset: 1699010000 }
  };

  it('should render correctly with weather data', () => {
    const { getByText } = render(<CurrentWeather weatherData={mockWeatherData} />);
    
    expect(getByText('Beijing')).toBeTruthy();
    expect(getByText('20°')).toBeTruthy();
    expect(getByText('Sunny')).toBeTruthy();
    expect(getByText('Feels like 18°')).toBeTruthy();
  });

  it('should display humidity and wind speed', () => {
    const { getByText } = render(<CurrentWeather weatherData={mockWeatherData} />);
    
    expect(getByText('50%')).toBeTruthy();
    expect(getByText('3.5 m/s')).toBeTruthy();
  });

  it('should call onRefresh when refresh button is pressed', () => {
    const mockOnRefresh = jest.fn();
    const { getByTestId } = render(
      <CurrentWeather weatherData={mockWeatherData} onRefresh={mockOnRefresh} />
    );
    
    fireEvent.press(getByTestId('refresh-button'));
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });
});
```

### 10.3 集成测试

**测试范围**:
- 多个组件之间的交互
- 页面导航流程
- API 调用和数据流程

**测试工具**:
- Detox: 端到端测试框架
- Appium: 跨平台自动化测试

**测试场景**:
1. **位置权限流程**:
   - 首次启动应用
   - 请求位置权限
   - 权限授权/拒绝后的行为

2. **天气获取流程**:
   - 获取当前位置
   - 调用 API 获取天气
   - 显示天气信息

3. **城市搜索流程**:
   - 输入城市名称
   - 显示搜索结果
   - 选择城市并查看天气

4. **离线缓存流程**:
   - 在线时获取天气数据
   - 切换到离线模式
   - 验证缓存数据是否正常显示

### 10.4 性能测试

**测试范围**:
- 应用启动时间
- 页面渲染性能
- 内存使用情况
- 电池消耗

**测试工具**:
- React Native Performance Monitor
- Flipper: 调试工具
- Android Studio Profiler / Xcode Instruments

**测试指标**:
- 冷启动时间 < 3 秒
- 热启动时间 < 1 秒
- 页面切换帧率 > 60fps
- 内存峰值 < 200MB
- 空闲时 CPU 使用率 < 5%

## 11. 部署计划

### 11.1 开发环境搭建

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **配置 API 密钥**:
   - 在 `app.json` 中配置 `extra.weatherApiKey`
   - 或者使用环境变量

3. **启动开发服务器**:
   ```bash
   npx expo start
   ```

### 11.2 构建和发布

**Expo 构建流程**:

1. **登录 Expo 账户**:
   ```bash
   npx expo login
   ```

2. **构建 Android APK/AAB**:
   ```bash
   npx expo build:android
   ```

3. **构建 iOS IPA**:
   ```bash
   npx expo build:ios
   ```

4. **OTA 更新**:
   ```bash
   npx expo publish
   ```

**应用商店发布**:

1. **Android (Google Play Store)**:
   - 生成签名密钥
   - 构建 AAB 文件
   - 上传到 Google Play Console
   - 填写应用信息
   - 提交审核

2. **iOS (App Store)**:
   - 配置 Apple Developer 账户
   - 构建 IPA 文件
   - 上传到 App Store Connect
   - 填写应用信息
   - 提交审核

### 11.3 版本管理

**版本命名规范**:
- 主版本号.次版本号.修订号 (如: 1.0.0)
- 预发布版本: 1.0.0-alpha.1, 1.0.0-beta.1
- 构建号: 每个版本递增

**发布计划**:
- **Alpha 版本**: 内部测试，功能基本完成，可能有 bug
- **Beta 版本**: 公开测试，功能稳定，收集用户反馈
- **Release 版本**: 正式发布，经过全面测试

## 12. 附录

### 12.1 参考资料

- [React Native 官方文档](https://reactnative.dev/docs/getting-started)
- [Expo 官方文档](https://docs.expo.dev/)
- [OpenWeatherMap API 文档](https://openweathermap.org/api)
- [React Navigation 文档](https://reactnavigation.org/docs/getting-started)
- [Lottie 动画库](https://airbnb.io/lottie/#/react-native)

### 12.2 术语表

| 术语 | 定义 |
|------|------|
| Expo | 一个基于 React Native 的开发框架，提供工具和服务简化移动应用开发 |
| API | 应用程序编程接口，用于不同软件组件之间的通信 |
| 离线缓存 | 将数据存储在本地，以便在没有网络连接时也能访问 |
| Lottie | 一个动画库，支持渲染 Adobe After Effects 导出的动画 |
| AsyncStorage | React Native 中的简单、异步、持久化键值存储系统 |
| 状态管理 | 管理应用程序状态的技术，确保数据在组件间一致传递 |

### 12.3 联系信息

- 项目负责人: [负责人姓名]
- 开发团队: [团队名称]
- 联系邮箱: [邮箱地址]
- 项目仓库: [Git 仓库地址]
