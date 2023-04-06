#!/bin/bash
# script.sh

# Read the input from the user
echo "Enter the password (input will be hidden): "

# Initialize an empty password string
INPUT_PASSWORD=""

# Save the current terminal settings
stty_saved="$(stty -g)"

# Disable echo and enable raw input mode
stty -echo raw

# Read characters one by one
while IFS= read -r -n1 char; do
  # Check for Enter key (carriage return or linefeed)
  if [[ $char == "" ]]; then
    break
  # Check for Backspace key (ASCII 127)
  elif [[ $char == $'\x7f' ]]; then
    # Remove the last character from the password string
    INPUT_PASSWORD="${INPUT_PASSWORD%?}"
    # Move the cursor back, print a space, and move the cursor back again
    printf "\b \b"
  else
    # Add the character to the password string
    INPUT_PASSWORD+="$char"

    # Print an asterisk for each character entered
    printf "*"
  fi
done

# Restore the terminal settings
stty "$stty_saved"
printf "\n"

# Export the environment variable
export ENV_ENC_PASSWORD="$INPUT_PASSWORD"

# Get the user's preferred shell or fall back to bash
PREFERRED_SHELL="${SHELL:-/bin/bash}"

# Execute the preferred shell to avoid storing the variable in history
exec $PREFERRED_SHELL
