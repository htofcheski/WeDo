package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

func UpgradeRequest(r *http.Request) *Request {
	return &Request{Base: r}
}

func (r *Request) QueryOrDefault(key, _default string) string {
	if value := r.Base.URL.Query().Get(key); len(value) > 0 {
		return value
	}
	return _default
}

func (r *Request) QueryBoolDefault(key string, _default bool) bool {
	str := strings.ToLower(r.Base.URL.Query().Get(key))
	if len(str) > 0 {
		return str == "true" || str == "1"
	}
	return _default
}

func (r *Request) ReadBody() ([]byte, error) {
	if len(r.body) == 0 {
		var err error
		r.body, err = ioutil.ReadAll(r.Base.Body)
		r.Base.Body.Close()
		return r.body, err
	}
	return r.body, nil
}

func (r *Request) ReadBodyJSON(dest interface{}) error {
	body, err := r.ReadBody()
	if err != nil {
		return err
	}
	if len(body) == 0 {
		return fmt.Errorf("Body of %q is empty", r.Base.URL.Path)
	}
	return json.Unmarshal(body, dest)
}
