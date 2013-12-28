#!/bin/sh -e

EXECUTABLE_DIR="`cd \`dirname "$0"\`; pwd`/"
EXECUTABLE_NAME="ActivationWizard.exe"

EXECUTABLE="${EXECUTABLE_DIR}${EXECUTABLE_NAME}"

if [ ! -f "${EXECUTABLE_DIR}libNCore.so" -o ! -f "${EXECUTABLE_DIR}libNLicensing.so" -o ! -f "${EXECUTABLE_DIR}libNLicenseManager.so" ]; then
	echo "ERROR: Can't find required libraries."
	exit 1;
fi

if ! type "mono" > /dev/null 2>&1; then
	echo "ERROR: Can't find 'mono'."
	echo "       The Mono isn't installed to your system"
	echo "       or the enviroment varable PATH does not contain"
	echo "       the directory where the Mono's bin directory is located."
	exit 1;
fi

EXECUTABLE_CMD="LD_LIBRARY_PATH=\"${EXECUTABLE_DIR}:${LD_LIBRARY_PATH}\" mono \"${EXECUTABLE}\""

if [ "`id -u`" = "0" ]; then
	eval "${EXECUTABLE_CMD}";
else
	xterm -T "${EXECUTABLE_NAME}" -e "
		echo \"The action you requested needs root access. Please enter root's password below.\";
		su -c \"${EXECUTABLE_CMD}\" || sleep 5;" 
fi

exit 0

