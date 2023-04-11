#!/bin/bash
# script.sh

# Ensure nothing is stored in the terminal history for the current session
SAVED_HISTFILE="$HISTFILE"
SAVED_HISTSIZE="$HISTSIZE"
export HISTFILE="/dev/null"
export HISTSIZE="0"

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

# Re-enable history
export HISTFILE="$SAVED_HISTFILE"
export HISTSIZE="$SAVED_HISTSIZE"

# Get the user's preferred shell or fall back to bash
PREFERRED_SHELL="${SHELL:-/bin/bash}"

# Execute the preferred shell to pass the ENV_ENC_PASSWORD var to the child process
exec $PREFERRED_SHELL
