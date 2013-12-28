#!/bin/bash

###
# Configuration section
# 

# Specify full path to directory with pgd executable and config files here:
# For example: PGD_DIR="/usr/local/Neurotechnology/Activation"
PGD_DIR=""

#
# End of Configuration section
###


# If PGD_DIR is not set use the directory of current script
if [ ! "${PGD_DIR}" ]
then
	PGD_DIR=`dirname "$0"`

	# If we were called through relative path, make absolute one
	if [ "${PGD_DIR:0:1}" != "/" ]
	then
		PGD_DIR="$PWD/$PGD_DIR"
	fi
fi

NAME=pgd
PROGRAM="${PGD_DIR}/${NAME}"
if [ "`uname -s`" = "Darwin" ]
then
	LOG=/Library/Logs/pgd.log
else
	LOG=/tmp/pgd.log
fi

###
# Common routines section
#

echo_()
{
	echo "run_pgd.sh:" "$*"
}

get_pid()
{
	if which pidof &> /dev/null
	then
		echo `pidof -s $NAME`
	else
		ps axc|awk "{if (\$5==\"$NAME\") print \$1}"
	fi
}

start_pgd()
{
  	echo_ "starting $NAME..."
	PRESERVE_DIR="$PWD"
	cd "$PGD_DIR"
	"$PROGRAM"
	cd "$PRESERVE_DIR"
	sleep 1
	if [ -s "$LOG" ]
	then
		echo_ "$NAME run log ($LOG):"
		echo  "----------------------------------------"
		cat   "$LOG"
		echo  "----------------------------------------"
	fi
}

stop_pgd()
{
	PID=`get_pid`
	if [ $PID ]
	then 
  		echo_ "stopping $NAME..."
		kill $PID
		echo_ "$NAME (pid=$PID) was sent a signal."
	else
		echo_ "$NAME processs not running!"
		exit 1
	fi
}

###
# Body...
#

if ! test -d "$PGD_DIR"
then
	echo_ "Wrong PGD_DIR variable value specified: $PGD_DIR"
	echo_ "Please point it to correct place with $NAME application."
	echo_ "Please also ensure that needed configuration files are there."
	exit 1
fi 
if ! test -f "$PROGRAM"
then
	echo_ "$PROGRAM application not found!"
	exit 1
fi
if ! test -x "$PROGRAM"
then
	echo_ "$PROGRAM application not runable!"
	exit 1
fi


case "$1" in
  start)
	PID=`get_pid`
	if [ $PID ]
	then
		echo_ "$NAME is already running (pid: $PID)"
		exit 1
	fi

	[ ! -f $LOG ] || rm $LOG
	start_pgd
	;;
  stop)
  	stop_pgd
	;;
  restart)
	stop_pgd

	sleep 4

	if [ `get_pid` ]
	then
		echo_ "$NAME has not stopped!"
		echo_ "restart failed."
		exit 1
	fi

  	[ ! -f $LOG ] || rm $LOG
	start_pgd
	;;
  log)
	PID=`get_pid`
	if [ $PID ]
	then 
		echo_ "$NAME is running with pid: $PID"
	else
		echo_ "$NAME processs not running!"
	fi
	
  	if [ -s "$LOG" ]
	then 
		echo_ "log ($LOG):"
		echo  "----------------------------------------"
		cat   "$LOG"
		echo  "----------------------------------------"
	else
		echo_ "log file (\"$LOG\") is empty."
	fi
	;;
  *)
	echo "Usage: $0 {start|stop|restart|log}"
	exit 1
esac

exit 0
