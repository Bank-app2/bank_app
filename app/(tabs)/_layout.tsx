import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

function renderTabIcon(name: any, color: string, focused: boolean) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 40, width: 40 }}>
      <IconSymbol size={24} name={name} color={color} />
      {focused && (
        <View 
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: '#C5F347', // Brand Lime Green active dot
            marginTop: 6,
          }}
        />
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10201B',
        tabBarInactiveTintColor: '#B9BAAE',
        headerShown: false,
        tabBarShowLabel: false, // Hide text labels below icons
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => renderTabIcon('house', color, focused),
        }}
      />
      <Tabs.Screen
        name="zara"
        options={{
          title: 'Zara',
          tabBarIcon: ({ color, focused }) => renderTabIcon('mic', color, focused),
        }}
      />
      <Tabs.Screen
        name="buckets"
        options={{
          title: 'Buckets',
          tabBarIcon: ({ color, focused }) => renderTabIcon('tray', color, focused),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => renderTabIcon('gearshape', color, focused),
        }}
      />
    </Tabs>
  );
}

