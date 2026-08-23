import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:verzzify/main.dart';
import 'package:verzzify/player_controller.dart';

void main() {
  testWidgets('app boots', (tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => PlayerController(),
        child: const VerzZifyApp(),
      ),
    );
    expect(find.text('VerzZify'), findsNothing);
    expect(find.text('Play'), findsWidgets);
  });
}
