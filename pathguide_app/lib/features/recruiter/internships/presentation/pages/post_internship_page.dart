import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import 'package:pathguide_app/core/theme/app_colors.dart';
import 'package:pathguide_app/core/widgets/reusable_widgets.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pathguide_app/core/data/models.dart';
import 'package:pathguide_app/features/auth/presentation/bloc/auth_bloc.dart';
import 'package:pathguide_app/features/recruiter/internships/presentation/bloc/internship_bloc.dart';

class PostInternshipPage extends StatefulWidget {
  final InternshipModel? editInternship;
  const PostInternshipPage({super.key, this.editInternship});

  @override
  State<PostInternshipPage> createState() => _PostInternshipPageState();
}

class _PostInternshipPageState extends State<PostInternshipPage> {
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _durationController = TextEditingController();
  final _stipendController = TextEditingController();
  final _startDateController = TextEditingController();
  final _deadlineController = TextEditingController();
  final _otherSkillController = TextEditingController();
  final _descriptionController = TextEditingController();

  DateTime? _startDate;
  DateTime? _deadlineDate;
  List<String> _selectedSkills = [];

  final List<String> _skillMasterList = [
    'Flutter', 'React Native', 'Java', 'Python', 'Node.js',
    'UI/UX Design', 'Figma', 'Marketing', 'Sales', 'Graphic Design',
    'Others'
  ];

  bool get _isEditing => widget.editInternship != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _prefill(widget.editInternship!);
  }

  void _prefill(InternshipModel i) {
    _titleController.text = i.title;
    _locationController.text = i.location;
    _durationController.text = i.duration;
    _stipendController.text = i.stipend;
    _startDateController.text = i.startDate;
    _deadlineController.text = i.deadline;
    _descriptionController.text = i.description;

    // Parse skills back into the selection list
    final parts = i.requiredSkill.split(',').map((s) => s.trim()).toList();
    for (final skill in parts) {
      if (_skillMasterList.contains(skill)) {
        _selectedSkills.add(skill);
      } else if (skill.isNotEmpty) {
        _selectedSkills.add('Others');
        _otherSkillController.text = skill;
      }
    }

    // Parse dates for the picker constraints
    _startDate = _parseDate(i.startDate);
    _deadlineDate = _parseDate(i.deadline);
  }

  DateTime? _parseDate(String s) {
    try {
      final p = s.split('/');
      return DateTime(int.parse(p[2]), int.parse(p[1]), int.parse(p[0]));
    } catch (_) {
      return null;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    _durationController.dispose();
    _stipendController.dispose();
    _startDateController.dispose();
    _deadlineController.dispose();
    _otherSkillController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  ThemeData get _datePickerTheme => Theme.of(context).copyWith(
        colorScheme: const ColorScheme.light(
          primary: AppColors.primaryBlue,
          onPrimary: Colors.white,
          onSurface: AppColors.darkNavy,
        ),
      );

  Future<void> _selectStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2101),
      builder: (context, child) => Theme(data: _datePickerTheme, child: child!),
    );
    if (picked != null) {
      setState(() {
        _startDate = picked;
        _startDateController.text = DateFormat('dd/MM/yyyy').format(picked);
        if (_deadlineDate != null && !_deadlineDate!.isAfter(picked)) {
          _deadlineDate = null;
          _deadlineController.clear();
        }
      });
    }
  }

  Future<void> _selectDeadline() async {
    if (_startDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a start date first'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
      return;
    }
    final firstAllowed = _startDate!.add(const Duration(days: 1));
    final picked = await showDatePicker(
      context: context,
      initialDate: (_deadlineDate != null && _deadlineDate!.isAfter(_startDate!))
          ? _deadlineDate!
          : firstAllowed,
      firstDate: firstAllowed,
      lastDate: DateTime(2101),
      builder: (context, child) => Theme(data: _datePickerTheme, child: child!),
    );
    if (picked != null) {
      setState(() {
        _deadlineDate = picked;
        _deadlineController.text = DateFormat('dd/MM/yyyy').format(picked);
      });
    }
  }

  void _showSkillsDialog() {
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Select Required Skills',
              style: TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: SizedBox(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: _skillMasterList.length,
                    itemBuilder: (context, index) {
                      final skill = _skillMasterList[index];
                      final isSelected = _selectedSkills.contains(skill);
                      return CheckboxListTile(
                        title: Text(skill),
                        value: isSelected,
                        activeColor: AppColors.primaryBlue,
                        onChanged: (value) {
                          setDialogState(() {
                            if (value == true) {
                              _selectedSkills.add(skill);
                            } else {
                              _selectedSkills.remove(skill);
                            }
                          });
                          setState(() {});
                        },
                      );
                    },
                  ),
                ),
                if (_selectedSkills.contains('Others')) ...[
                  const SizedBox(height: 12),
                  AppTextField(
                    label: 'Enter Custom Skills',
                    hint: 'e.g. Kotlin, Swift',
                    controller: _otherSkillController,
                    onChanged: (v) => setState(() {}),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Done',
                  style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate() || _selectedSkills.isEmpty) return;

    final authState = context.read<AuthBloc>().state;
    String companyName = 'Company';
    if (authState is AuthAuthenticated) {
      companyName = authState.user.companyName ?? authState.user.name;
    }

    String skillsText = _selectedSkills.join(', ');
    if (_selectedSkills.contains('Others') && _otherSkillController.text.isNotEmpty) {
      skillsText = skillsText.replaceFirst('Others', _otherSkillController.text.trim());
    }

    final internship = InternshipModel(
      id: _isEditing ? widget.editInternship!.id : DateTime.now().millisecondsSinceEpoch.toString(),
      title: _titleController.text.trim(),
      company: _isEditing ? widget.editInternship!.company : companyName,
      description: _descriptionController.text.trim(),
      location: _locationController.text.trim(),
      duration: _durationController.text.trim(),
      stipend: _stipendController.text.trim(),
      startDate: _startDateController.text,
      deadline: _deadlineController.text,
      requiredSkill: skillsText,
      isActive: _isEditing ? widget.editInternship!.isActive : true,
    );

    if (_isEditing) {
      context.read<InternshipBloc>().add(EditInternship(internship));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Internship updated successfully!'),
          backgroundColor: AppColors.successGreen,
        ),
      );
      context.pop();
    } else {
      context.read<InternshipBloc>().add(AddInternship(internship));
      _showSuccessDialog();
    }
  }

  @override
  Widget build(BuildContext context) {
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
        title: Text(
          _isEditing ? 'Edit Internship' : 'Post Internship',
          style: const TextStyle(color: AppColors.darkNavy, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      bottomNavigationBar: const RecruiterBottomNav(currentIndex: 1),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: 'Create Opportunity',
                  subtitle: 'Fill in the details to reach potential candidates.',
                ),
                const SizedBox(height: 32),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Basic Information',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
                      const SizedBox(height: 20),
                      AppTextField(
                        label: 'Internship Title',
                        hint: 'e.g. Flutter Developer Intern',
                        controller: _titleController,
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        label: 'Location',
                        hint: 'e.g. Remote, Cairo, Egypt',
                        controller: _locationController,
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: AppTextField(
                              label: 'Duration',
                              hint: 'e.g. 3 Months',
                              controller: _durationController,
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: AppTextField(
                              label: 'Stipend',
                              hint: 'e.g. 5000 EGP',
                              controller: _stipendController,
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Timeline & Skills',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: AppTextField(
                              label: 'Start Date',
                              hint: 'DD/MM/YYYY',
                              controller: _startDateController,
                              suffixIcon: Icons.calendar_today_outlined,
                              readOnly: true,
                              onTap: _selectStartDate,
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: AppTextField(
                              label: 'Deadline',
                              hint: 'DD/MM/YYYY',
                              controller: _deadlineController,
                              suffixIcon: Icons.calendar_today_outlined,
                              readOnly: true,
                              onTap: _selectDeadline,
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text('Required Skills',
                          style: TextStyle(color: AppColors.mutedText, fontSize: 14)),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: _showSkillsDialog,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.cardBorder),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _selectedSkills.isEmpty
                                      ? 'Select skills...'
                                      : _selectedSkills.join(', ') +
                                          (_selectedSkills.contains('Others') &&
                                                  _otherSkillController.text.isNotEmpty
                                              ? ': ${_otherSkillController.text}'
                                              : ''),
                                  style: TextStyle(
                                    color: _selectedSkills.isEmpty
                                        ? AppColors.mutedText
                                        : AppColors.darkNavy,
                                    fontSize: 14,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const Icon(Icons.add_circle_outline,
                                  color: AppColors.primaryBlue, size: 20),
                            ],
                          ),
                        ),
                      ),
                      if (_selectedSkills.isEmpty)
                        const Padding(
                          padding: EdgeInsets.only(top: 8, left: 4),
                          child: Text('Please select at least one skill',
                              style: TextStyle(color: Colors.red, fontSize: 12)),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Detailed Description',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.darkNavy)),
                      const SizedBox(height: 20),
                      AppTextField(
                        label: 'Description',
                        hint: 'Describe the roles and responsibilities...',
                        controller: _descriptionController,
                        maxLines: 5,
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
                GradientButton(
                  text: _isEditing ? 'Save Changes' : 'Publish Internship',
                  onPressed: _submit,
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_outline, color: AppColors.successGreen, size: 80),
            const SizedBox(height: 24),
            const Text('Internship Posted!',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const Text(
              'Your internship has been successfully posted and is now visible to students.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.mutedText),
            ),
            const SizedBox(height: 32),
            GradientButton(
              text: 'Done',
              onPressed: () {
                Navigator.of(context).pop();
                context.go('/recruiter/my-internships');
              },
            ),
          ],
        ),
      ),
    );
  }
}
