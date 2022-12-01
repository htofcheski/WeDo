package main

import "net/http"

func UpgradeRequest(r *http.Request) *Request {
	return &Request{r}
}

func (r *Request) QueryOrDefault(key, _default string) string {
	if value := r.URL.Query().Get(key); len(value) > 0 {
		return value
	}
	return _default
}
