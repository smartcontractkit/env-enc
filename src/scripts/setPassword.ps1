# script.ps1

# Read the input from the user
$INPUT_PASSWORD = Read-Host -Prompt "Enter the password (input will be hidden)" -AsSecureString

# Convert SecureString to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($INPUT_PASSWORD)
$PLAINTEXT_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set the environment variable
$env:ENV_ENC_PASSWORD = $PLAINTEXT_PASSWORD

# Start a new PowerShell session to avoid storing the variable in history
powershell.exe -NoLogo
