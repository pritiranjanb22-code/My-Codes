namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using NetUsageMonitor.Core.Interfaces;

public partial class LoginViewModel : ViewModelBase
{
    private readonly IAuthService _authService;

    [ObservableProperty]
    private string _username = "admin";

    [ObservableProperty]
    private string _password = "admin123";

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    [ObservableProperty]
    private bool _rememberMe;

    public LoginViewModel(IAuthService authService)
    {
        _authService = authService;
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        IsBusy = true;
        ErrorMessage = string.Empty;
        
        try
        {
            var success = await _authService.ValidateCredentialsAsync(Username, Password);
            if (success)
            {
                // Set dialog result
                System.Windows.Application.Current.Windows.OfType<System.Windows.Window>()
                    .FirstOrDefault(w => w.DataContext == this)?.Close();
            }
            else
            {
                ErrorMessage = "Invalid username or password";
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Login failed: {ex.Message}";
        }
        finally
        {
            IsBusy = false;
        }
    }
}