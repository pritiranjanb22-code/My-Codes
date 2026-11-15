namespace NetUsageMonitor.Core.ValueObjects;

public readonly record struct MacAddress(string Value)
{
    public static bool TryParse(string? value, out MacAddress mac)
    {
        mac = default;
        if (string.IsNullOrWhiteSpace(value))
            return false;
        
        var cleaned = value.Replace(":", "").Replace("-", "").Replace(".", "").ToUpperInvariant();
        if (cleaned.Length != 12 || !cleaned.All(c => "0123456789ABCDEF".Contains(c)))
            return false;
        
        mac = new MacAddress(string.Join(":", Enumerable.Range(0, 6).Select(i => cleaned.Substring(i * 2, 2))));
        return true;
    }
    
    public override string ToString() => Value;
}

public readonly record struct IpAddress(string Value)
{
    public static bool TryParse(string? value, out IpAddress ip)
    {
        ip = default;
        if (string.IsNullOrWhiteSpace(value))
            return false;
        
        if (System.Net.IPAddress.TryParse(value, out _))
        {
            ip = new IpAddress(value);
            return true;
        }
        
        return false;
    }
    
    public override string ToString() => Value;
}

public readonly record struct InterfaceIndex(int Value)
{
    public static implicit operator int(InterfaceIndex index) => index.Value;
    public static implicit operator InterfaceIndex(int value) => new(value);
    public override string ToString() => Value.ToString();
}

public readonly struct DataSize : IComparable<DataSize>, IEquatable<DataSize>
{
    private readonly long _bytes;
    
    public long Bytes => _bytes;
    public double Kilobytes => _bytes / 1024.0;
    public double Megabytes => _bytes / (1024.0 * 1024.0);
    public double Gigabytes => _bytes / (1024.0 * 1024.0 * 1024.0);
    public double Terabytes => _bytes / (1024.0 * 1024.0 * 1024.0 * 1024.0);
    
    public double Kibibytes => _bytes / 1024.0;
    public double Mebibytes => _bytes / (1024.0 * 1024.0);
    public double Gibibytes => _bytes / (1024.0 * 1024.0 * 1024.0);
    public double Tebibytes => _bytes / (1024.0 * 1024.0 * 1024.0 * 1024.0);
    
    public DataSize(long bytes) => _bytes = bytes;
    
    public static DataSize FromBytes(long bytes) => new(bytes);
    public static DataSize FromKilobytes(double kb) => new((long)(kb * 1024));
    public static DataSize FromMegabytes(double mb) => new((long)(mb * 1024 * 1024));
    public static DataSize FromGigabytes(double gb) => new((long)(gb * 1024 * 1024 * 1024));
    public static DataSize FromTerabytes(double tb) => new((long)(tb * 1024 * 1024 * 1024 * 1024));
    
    public static DataSize FromKibibytes(double kib) => new((long)(kib * 1024));
    public static DataSize FromMebibytes(double mib) => new((long)(mib * 1024 * 1024));
    public static DataSize FromGibibytes(double gib) => new((long)(gib * 1024 * 1024 * 1024));
    public static DataSize FromTebibytes(double tib) => new((long)(tib * 1024 * 1024 * 1024 * 1024));
    
    public string ToString(DataUnit unit, bool useBinary = false, int decimals = 2)
    {
        var (value, suffix) = unit switch
        {
            DataUnit.Bytes => (_bytes, "B"),
            DataUnit.Kilobytes => (Kilobytes, "KB"),
            DataUnit.Megabytes => (Megabytes, "MB"),
            DataUnit.Gigabytes => (Gigabytes, "GB"),
            DataUnit.Terabytes => (Terabytes, "TB"),
            DataUnit.Kibibytes => (Kibibytes, "KiB"),
            DataUnit.Mebibytes => (Mebibytes, "MiB"),
            DataUnit.Gibibytes => (Gibibytes, "GiB"),
            DataUnit.Tebibytes => (Tebibytes, "TiB"),
            _ => (_bytes, "B")
        };
        
        if (useBinary && unit <= DataUnit.Terabytes)
        {
            var binaryUnit = (DataUnit)((int)unit + 100);
            return ToString(binaryUnit, false, decimals);
        }
        
        return $"{value:F{decimals}} {suffix}";
    }
    
    public string ToAutoString(bool useBinary = false, int decimals = 2)
    {
        var abs = Math.Abs(_bytes);
        if (abs >= 1024L * 1024 * 1024 * 1024)
            return ToString(useBinary ? DataUnit.Tebibytes : DataUnit.Terabytes, useBinary, decimals);
        if (abs >= 1024L * 1024 * 1024)
            return ToString(useBinary ? DataUnit.Gibibytes : DataUnit.Gigabytes, useBinary, decimals);
        if (abs >= 1024L * 1024)
            return ToString(useBinary ? DataUnit.Mebibytes : DataUnit.Megabytes, useBinary, decimals);
        if (abs >= 1024)
            return ToString(useBinary ? DataUnit.Kibibytes : DataUnit.Kilobytes, useBinary, decimals);
        return ToString(DataUnit.Bytes, false, decimals);
    }
    
    public int CompareTo(DataSize other) => _bytes.CompareTo(other._bytes);
    public bool Equals(DataSize other) => _bytes == other._bytes;
    public override bool Equals(object? obj) => obj is DataSize other && Equals(other);
    public override int GetHashCode() => _bytes.GetHashCode();
    public static bool operator ==(DataSize left, DataSize right) => left.Equals(right);
    public static bool operator !=(DataSize left, DataSize right) => !left.Equals(right);
    public static bool operator <(DataSize left, DataSize right) => left.CompareTo(right) < 0;
    public static bool operator >(DataSize left, DataSize right) => left.CompareTo(right) > 0;
    public static bool operator <=(DataSize left, DataSize right) => left.CompareTo(right) <= 0;
    public static bool operator >=(DataSize left, DataSize right) => left.CompareTo(right) >= 0;
    
    public static DataSize operator +(DataSize left, DataSize right) => new(left._bytes + right._bytes);
    public static DataSize operator -(DataSize left, DataSize right) => new(left._bytes - right._bytes);
    public static DataSize operator *(DataSize left, double right) => new((long)(left._bytes * right));
    public static DataSize operator /(DataSize left, double right) => new((long)(left._bytes / right));
    
    public override string ToString() => ToAutoString();
}