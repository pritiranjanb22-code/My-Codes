namespace NetUsageMonitor.Wpf.Views;

using System.Windows;
using System.Windows.Controls;

public partial class NavButton : UserControl
{
    public static readonly DependencyProperty IconProperty =
        DependencyProperty.Register(nameof(Icon), typeof(string), typeof(NavButton), new PropertyMetadata(""));

    public static readonly DependencyProperty TextProperty =
        DependencyProperty.Register(nameof(Text), typeof(string), typeof(NavButton), new PropertyMetadata(""));

    public static readonly DependencyProperty CommandProperty =
        DependencyProperty.Register(nameof(Command), typeof(System.Windows.Input.ICommand), typeof(NavButton));

    public static readonly DependencyProperty IsSelectedProperty =
        DependencyProperty.Register(nameof(IsSelected), typeof(bool), typeof(NavButton), new PropertyMetadata(false));

    public static readonly DependencyProperty BadgeProperty =
        DependencyProperty.Register(nameof(Badge), typeof(int), typeof(NavButton), new PropertyMetadata(0));

    public static readonly DependencyProperty BadgeVisibilityProperty =
        DependencyProperty.Register(nameof(BadgeVisibility), typeof(Visibility), typeof(NavButton), new PropertyMetadata(Visibility.Collapsed));

    public string Icon { get => (string)GetValue(IconProperty); set => SetValue(IconProperty, value); }
    public string Text { get => (string)GetValue(TextProperty); set => SetValue(TextProperty, value); }
    public System.Windows.Input.ICommand Command { get => (System.Windows.Input.ICommand)GetValue(CommandProperty); set => SetValue(CommandProperty, value); }
    public bool IsSelected { get => (bool)GetValue(IsSelectedProperty); set => SetValue(IsSelectedProperty, value); }
    public int Badge { get => (int)GetValue(BadgeProperty); set => SetValue(BadgeProperty, value); }
    public Visibility BadgeVisibility { get => (Visibility)GetValue(BadgeVisibilityProperty); set => SetValue(BadgeVisibilityProperty, value); }

    public NavButton()
    {
        InitializeComponent();
    }
}