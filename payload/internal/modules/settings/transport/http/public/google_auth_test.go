package publicconfighttp

import (
	"context"
	"encoding/json"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

type legacyTemplateCache struct{}

func (legacyTemplateCache) CacheKey(*uint) string { return "test-config" }
func (legacyTemplateCache) GetJSON(_ context.Context, _ string, dest *map[string]interface{}) (bool, error) {
	*dest = map[string]interface{}{"storefront_template": "vault", "other": "preserved"}
	return true, nil
}
func (legacyTemplateCache) SetJSON(context.Context, string, interface{}, time.Duration) error {
	return nil
}

func TestCachedVaultTemplateRetainsIdentity(t *testing.T) {
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest("GET", "/api/v1/public/config", nil)
	h := Handler{cache: legacyTemplateCache{}}
	h.GetConfig(ctx)
	var result struct {
		Data map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal(recorder.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if recorder.Code != 200 || result.Data["storefront_template"] != "vault" || result.Data["other"] != "preserved" {
		t.Fatalf("cached config response: %s", recorder.Body.String())
	}
}

type googleAuthPublicStub map[string]interface{}

func (s googleAuthPublicStub) PublicConfig() map[string]interface{} {
	return map[string]interface{}(s)
}

func TestResolveGoogleAuthPublicConfig(t *testing.T) {
	tests := []struct {
		name     string
		source   GoogleAuthPublic
		fallback GoogleAuthFallback
		want     map[string]interface{}
	}{
		{
			name:     "fallback enabled",
			fallback: GoogleAuthFallback{Enabled: true, ClientID: " fallback-client "},
			want:     map[string]interface{}{"enabled": true, "client_id": "fallback-client"},
		},
		{
			name:     "service overrides fallback",
			source:   googleAuthPublicStub{"enabled": true, "client_id": " runtime-client ", "unexpected": "private"},
			fallback: GoogleAuthFallback{Enabled: false, ClientID: "fallback-client"},
			want:     map[string]interface{}{"enabled": true, "client_id": "runtime-client"},
		},
		{
			name:     "missing client id fails closed",
			source:   googleAuthPublicStub{"enabled": true, "client_id": ""},
			fallback: GoogleAuthFallback{Enabled: true, ClientID: "fallback-client"},
			want:     map[string]interface{}{"enabled": false, "client_id": ""},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := resolveGoogleAuthPublicConfig(test.source, test.fallback); !reflect.DeepEqual(got, test.want) {
				t.Fatalf("public config = %#v, want %#v", got, test.want)
			}
		})
	}
}
