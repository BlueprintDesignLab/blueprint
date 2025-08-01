// Basic widget test for MobileUI main screen
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'main.dart';

void main() {
  testWidgets('MainScreen displays navigation and sections', (WidgetTester tester) async {
    await tester.pumpWidget(MobileUIApp());

    // Check for app bar title
    expect(find.text('Work & Social Scheduler'), findsOneWidget);

    // Check for bottom navigation items
    expect(find.text('Work Life'), findsOneWidget);
    expect(find.text('Social Life/Trips'), findsOneWidget);

    // Default section is Work Life
    expect(find.text('Work Life Section'), findsOneWidget);
    expect(find.text('Social Life/Trips Section'), findsNothing);

    // Tap to switch to Social Life/Trips
    await tester.tap(find.text('Social Life/Trips'));
    await tester.pump();
    expect(find.text('Social Life/Trips Section'), findsOneWidget);
    expect(find.text('Work Life Section'), findsNothing);
  });
}
