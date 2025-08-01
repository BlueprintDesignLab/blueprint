// Main entry point for the MobileUI node (Flutter)
// Handles user input, task management, displays schedules and AI tips.
// Interacts with AuthService, FirestoreDB, SchedulerEngine, and AITipsAgent via edge interfaces/stubs.

import 'package:flutter/material.dart';
// Edge interfaces/stubs
import '../edges/interfaces/AuthFlow.dart';
import '../edges/interfaces/DBAccess.dart';
import '../edges/autogen/schedule_request.MobileUI.dart';
import '../edges/autogen/ai_tips_request.MobileUI.dart';

void main() {
  runApp(MobileUIApp());
}

class MobileUIApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Work & Social Scheduler',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;
  final List<Widget> _sections = [
    WorkLifeSection(),
    SocialLifeSection(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Work & Social Scheduler'),
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () async {
              await AuthFlow.logout();
              // TODO: Navigate to login screen
            },
          ),
        ],
      ),
      body: _sections[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.work),
            label: 'Work Life',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'Social Life/Trips',
          ),
        ],
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
      ),
    );
  }
}

class WorkLifeSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // TODO: Fetch and display work tasks, schedule, and AI tips
    return Center(child: Text('Work Life Section'));
  }
}

class SocialLifeSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // TODO: Fetch and display social tasks, trips, and AI tips
    return Center(child: Text('Social Life/Trips Section'));
  }
}
