import 'package:flutter/material.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';

class ApplicationStatusScreen extends StatelessWidget {
  const ApplicationStatusScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Applications', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildStatusFilter(),
          const SizedBox(height: 24),
          _buildApplicationItem(
            'Google',
            'Product Management Intern',
            'Interview Scheduled',
            AppColors.primaryBlue,
            'Oct 15, 2023',
          ),
          _buildApplicationItem(
            'Microsoft',
            'Software Dev Intern',
            'Under Review',
            Colors.orange,
            'Oct 12, 2023',
          ),
          _buildApplicationItem(
            'Amazon',
            'Cloud Architect Intern',
            'Rejected',
            AppColors.error,
            'Oct 10, 2023',
          ),
          _buildApplicationItem(
            'Meta',
            'Data Science Intern',
            'Offer Received',
            AppColors.success,
            'Oct 08, 2023',
          ),
        ],
      ),
    );
  }

  Widget _buildStatusFilter() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _StatusChip(label: 'All', isActive: true),
          _StatusChip(label: 'Pending'),
          _StatusChip(label: 'Interview'),
          _StatusChip(label: 'Rejected'),
          _StatusChip(label: 'Offers'),
        ],
      ),
    );
  }

  Widget _buildApplicationItem(String company, String role, String status, Color statusColor, String date) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    shape: BoxShape.circle,
                  ),
                  child: Center(child: Text(company[0])),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(role, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text(company, style: const TextStyle(color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Text(date, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
            const Divider(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
                TextButton(
                  onPressed: () {},
                  child: const Text('View Details'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final bool isActive;
  const _StatusChip({required this.label, this.isActive = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: isActive ? AppColors.primaryBlue : Colors.white,
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: isActive ? AppColors.primaryBlue : Colors.grey[300]!),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isActive ? Colors.white : AppColors.textSecondary,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

