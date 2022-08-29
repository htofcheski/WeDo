package main

import (
	"fmt"
	"log"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

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
