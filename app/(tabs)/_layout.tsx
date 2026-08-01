import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { Text } from 'react-native';

function renderTab(name: any, label: string, color: string, focused: boolean) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 50, width: 60, marginTop: 8 }}>
      <IconSymbol size={20} name={name} color={color} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: color, marginTop: 4 }}>{label}</Text>
      <View 
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: focused ? '#C5F347' : 'transparent', // Brand Lime Green active dot
          marginTop: 4,
        }}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#14140F',
        tabBarInactiveTintColor: '#7A7B70',
        headerShown: false,
        tabBarShowLabel: false, // We render the label inside tabBarIcon
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
          height: Platform.OS === 'ios' ? 95 : 75,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => renderTab('house', 'Home', color, focused),
        }}
      />
      <Tabs.Screen
        name="zara"
        options={{
          title: 'Zara',
          tabBarIcon: ({ color, focused }) => renderTab('mic', 'Zara', color, focused),
        }}
      />
      <Tabs.Screen
        name="buckets"
        options={{
          title: 'Buckets',
          tabBarIcon: ({ color, focused }) => renderTab('tray', 'Buckets', color, focused),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => renderTab('gearshape', 'Settings', color, focused),
        }}
      />
    </Tabs>
  );
}

