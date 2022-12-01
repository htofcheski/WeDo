package main

import (
	"fmt"
	"log"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// used for accessing apis with no ui.
const API_KEY = "220896d3-0bd7-47ca-ad84-d8adb4f12e99"

var (
	DB     Database
	Log    *zap.SugaredLogger
	Config = &config{
		Database: &DatabaseOptions{
			Driver:                DriverName,
			MaxOpenConnections:    -1,
			MaxIdleConnections:    -1,
			MaxLifetimeConnection: time.Hour * 6,
			MaxIdleTimeConnection: time.Hour * 1,
			DSN: map[string]interface{}{
				"parseTime": true,
				"loc":       "UTC",
			},
		},
	}
)

func initLogger() {
	loggerConfig := zap.NewProductionConfig()
	loggerConfig.EncoderConfig.TimeKey = "timestamp"
	loggerConfig.EncoderConfig.EncodeTime = zapcore.TimeEncoderOfLayout(time.RFC3339)

	logger, err := loggerConfig.Build()
	if err != nil {
		log.Fatal(err)
	}
	Log = logger.Sugar()
}

func main() {
	initLogger()
	initSessionManager()
	handleStartupError := func(err error) {
		if err == nil {
			return
		}
		if err := DB.Close(); err != nil {
			err = fmt.Errorf("DB.Close: %s", err.Error())
			Log.Error(err.Error())
		}

		Log.Fatal(err)
	}

	handleStartupError(Config.Read("data/config/dev.yml"))
	Log.Info(Config.Printable().Database)
	handleStartupError(DB.Initialize(Config.Database))
	handleStartupError(RunHTTP())
}
