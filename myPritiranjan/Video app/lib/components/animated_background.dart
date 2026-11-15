import 'dart:math';
import 'package:flutter/material.dart';
import 'package:watch_together/utils/app_theme.dart';

class AnimatedBackground extends StatefulWidget {
  final Widget child;
  final List<Color>? colors;
  final Duration duration;

  const AnimatedBackground({
    super.key,
    required this.child,
    this.colors,
    this.duration = const Duration(seconds: 20),
  });

  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late List<_BackgroundBlob> _blobs;

  @override
  void initState() {
    super.initState();
    
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    )..repeat(reverse: true);
    
    _initializeBlobs();
  }

  void _initializeBlobs() {
    final random = Random();
    final colors = widget.colors ?? [
      AppTheme.primaryColor.withValues(alpha: 0.15),
      AppTheme.secondaryColor.withValues(alpha: 0.15),
      AppTheme.accentColor.withValues(alpha: 0.1),
    ];
    
    _blobs = List.generate(8, (index) {
      return _BackgroundBlob(
        color: colors[random.nextInt(colors.length)],
        size: 100.0 + random.nextDouble() * 200,
        x: random.nextDouble(),
        y: random.nextDouble(),
        dx: (random.nextDouble() - 0.5) * 0.0005,
        dy: (random.nextDouble() - 0.5) * 0.0005,
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppTheme.backgroundColor,
                AppTheme.surfaceColor,
                AppTheme.backgroundColor,
              ],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
          child: Stack(
            children: [
              ..._blobs.map((blob) => _buildBlob(blob)),
              child!,
            ],
          ),
        );
      },
      child: widget.child,
    );
  }

  Widget _buildBlob(_BackgroundBlob blob) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    
    final x = (blob.x + blob.dx * _controller.value * 1000).clamp(0.0, 1.0) * screenWidth;
    final y = (blob.y + blob.dy * _controller.value * 1000).clamp(0.0, 1.0) * screenHeight;
    
    return Positioned(
      left: x - blob.size / 2,
      top: y - blob.size / 2,
      child: Container(
        width: blob.size,
        height: blob.size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: blob.color,
          boxShadow: [
            BoxShadow(
              color: blob.color.withValues(alpha: 0.5),
              blurRadius: blob.size / 2,
              spreadRadius: blob.size / 4,
            ),
          ],
        ),
      ),
    );
  }
}

class _BackgroundBlob {
  final Color color;
  final double size;
  double x;
  double y;
  final double dx;
  final double dy;

  _BackgroundBlob({
    required this.color,
    required this.size,
    required this.x,
    required this.y,
    required this.dx,
    required this.dy,
  });
}

class GradientBorder extends StatelessWidget {
  final Widget child;
  final double width;
  final double radius;
  final List<Color> gradientColors;
  final Gradient? gradient;

  const GradientBorder({
    super.key,
    required this.child,
    this.width = 2,
    this.radius = 16,
    this.gradientColors = const [AppTheme.primaryColor, AppTheme.secondaryColor],
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: gradient ?? LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: EdgeInsets.all(width),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(radius - width),
        ),
        child: child,
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double blur;
  final double opacity;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.blur = 20,
    this.opacity = 0.1,
    this.borderRadius,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding ?? const EdgeInsets.all(16),
      margin: margin,
      decoration: BoxDecoration(
        color: AppTheme.cardColor.withValues(alpha: opacity),
        borderRadius: borderRadius ?? BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.dividerColor.withValues(alpha: 0.3),
          width: 0.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: blur,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: borderRadius ?? BorderRadius.circular(16),
        child: card,
      );
    }

    return card;
  }
}