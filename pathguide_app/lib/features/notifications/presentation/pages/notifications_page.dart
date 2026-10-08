import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:pathguide_app/core/data/models.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  static const _typeStyles = {
    'Application Update': (Icons.send_rounded, [Color(0xFF6366F1), Color(0xFF8B5CF6)]),
    'New Internship':     (Icons.work_rounded,  [AppColors.teal, Color(0xFF06B6D4)]),
    'Course Completed':  (Icons.stars_rounded,  [Color(0xFFF59E0B), Color(0xFFF97316)]),
    'Offer Accepted':    (Icons.check_circle_rounded, [AppColors.successGreen, Color(0xFF059669)]),
  };

  @override
  Widget build(BuildContext context) {
    const notifications = <NotificationModel>[];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, color: AppColors.darkNavy, size: 20),
          onPressed: () => context.pop(),
        ),
        title: const Text('Notifications', style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('Mark all read', style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold, fontSize: 13)),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            PageHeroBanner(
              tag: '${notifications.where((n) => !n.isRead).length} unread',
              tagIcon: Icons.notifications_active_rounded,
              title: 'Notifications',
              subtitle: "Stay up to date with your applications and opportunities.",
              colors: const [AppColors.primaryBlue, AppColors.teal],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: notifications.isEmpty
                  ? _Empty()
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                      itemCount: notifications.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 12),
                      itemBuilder: (_, i) => _NotifCard(notification: notifications[i]),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotifCard extends StatelessWidget {
  final NotificationModel notification;
  const _NotifCard({required this.notification});

  @override
  Widget build(BuildContext context) {
    final style = NotificationsPage._typeStyles[notification.title] ??
        (Icons.notifications_rounded, const [AppColors.primaryBlue, AppColors.teal]);
    final icon = style.$1;
    final colors = style.$2;
    final isRead = notification.isRead;

    return Container(
      decoration: BoxDecoration(
        color: isRead ? Colors.white : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isRead ? AppColors.cardBorder : colors[0].withValues(alpha: 0.3), width: isRead ? 1 : 1.5),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isRead ? 0.03 : 0.06), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 5,
            height: double.infinity,
            margin: EdgeInsets.zero,
            decoration: BoxDecoration(
              gradient: isRead ? null : LinearGradient(colors: colors, begin: Alignment.topCenter, end: Alignment.bottomCenter),
              color: isRead ? Colors.transparent : null,
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(18)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: isRead ? null : LinearGradient(colors: colors),
                    color: isRead ? AppColors.cardBorder.withValues(alpha: 0.4) : null,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: isRead ? AppColors.mutedText : Colors.white, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              notification.title,
                              style: TextStyle(
                                fontWeight: isRead ? FontWeight.w600 : FontWeight.bold,
                                fontSize: 14,
                                color: isRead ? AppColors.darkNavy.withValues(alpha: 0.7) : AppColors.darkNavy,
                              ),
                            ),
                          ),
                          if (!isRead)
                            Container(
                              width: 8, height: 8,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(colors: colors),
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 5),
                      Text(
                        notification.message,
                        style: TextStyle(
                          color: isRead ? AppColors.mutedText : AppColors.darkNavy.withValues(alpha: 0.75),
                          fontSize: 13, height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isRead ? AppColors.cardBorder.withValues(alpha: 0.5) : colors[0].withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          notification.time,
                          style: TextStyle(color: isRead ? AppColors.mutedText : colors[0], fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.primaryBlue.withValues(alpha: 0.1), AppColors.teal.withValues(alpha: 0.1)]),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.notifications_off_outlined, size: 52, color: AppColors.primaryBlue),
          ),
          const SizedBox(height: 20),
          const Text('All caught up!', style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 8),
          const Text("We'll notify you when something happens.", style: TextStyle(color: AppColors.mutedText, fontSize: 14)),
        ],
      ),
    );
  }
}
