package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"sync"

	"gopkg.in/yaml.v2"
)

func FileExists(path string) bool {
	if len(path) == 0 {
		return false
	}
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return false
	}
	return true
}

func ReadFileYAML(path string, dest interface{}) ([]byte, error) {
	if b, err := ioutil.ReadFile(path); err == nil {
		return b, yaml.Unmarshal(b, dest)
	} else {
		return []byte{}, err
	}
}

func (c *config) Read(filepath string) error {
	if c.RWMutex == nil {
		c.RWMutex = new(sync.RWMutex)
	}

	c.Lock()
	defer c.Unlock()

	if !FileExists(filepath) {
		return fmt.Errorf("config.Read: %q does not exist", filepath)
	}
	_, err := ReadFileYAML(filepath, c)
	if err != nil {
		return fmt.Errorf("config.Read: %s", err)
	}

	return err
}

func (c *config) Printable() *config {
	temp := *c
	if temp.Database != nil {
		tempdb := *temp.Database
		if len(tempdb.Password) > 0 {
			tempdb.Password = "****"
		}
		temp.Database = &tempdb
	}
	return &temp
}
