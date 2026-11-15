namespace NetUsageMonitor.Wpf.ViewModels;

using CommunityToolkit.Mvvm.ComponentModel;
using System.ComponentModel;

public abstract partial class ViewModelBase : ObservableObject, IDisposable
{
    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string? _statusMessage;

    [ObservableProperty]
    private string? _errorMessage;

    public virtual void Dispose()
    {
        // Override in derived classes
    }

    protected void SetError(string? message)
    {
        ErrorMessage = message;
        StatusMessage = null;
    }

    protected void SetStatus(string? message)
    {
        StatusMessage = message;
        ErrorMessage = null;
    }

    protected void ClearMessages()
    {
        ErrorMessage = null;
        StatusMessage = null;
    }
}

public abstract partial class ViewModelBase<T> : ViewModelBase where T : class
{
    protected readonly T _service;

    protected ViewModelBase(T service)
    {
        _service = service;
    }
}