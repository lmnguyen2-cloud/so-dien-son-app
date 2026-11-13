package vn.sodienson;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.Toast;

import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.api.Scope;
import java.io.File;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
  private WebView so, otp;
  private Button bSo, bOtp, bTram;
  private ValueCallback<Uri[]> fileCb;
  private String tramJs = "", coreJs = "";
  private String[] pending = null;
  private boolean pendingSv = false;
  private static final int PICK = 7;
  private static final int AUTH = 8;
  private static final int ACC = 9;
  private static final String ZALO = "com.zing.zalo";
  private static final String OTP_URL = "https://otpsms.pro/Electric";

  @Override protected void onCreate(Bundle s) {
    super.onCreate(s);
    coreJs = readAsset("core.js");
    try (InputStream in = getAssets().open("tram.js")) { java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream(); byte[] buf = new byte[8192]; int n; while ((n = in.read(buf)) > 0) bo.write(buf, 0, n); tramJs = bo.toString("UTF-8"); } catch (Exception e) { tramJs = ""; }
    getWindow().setStatusBarColor(Color.parseColor("#0F7A55"));

    LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
    FrameLayout frame = new FrameLayout(this);
    so = makeWeb(); otp = makeWeb();
    frame.addView(so, new FrameLayout.LayoutParams(-1, -1));
    frame.addView(otp, new FrameLayout.LayoutParams(-1, -1));
    root.addView(frame, new LinearLayout.LayoutParams(-1, 0, 1f));

    LinearLayout bar = new LinearLayout(this); bar.setOrientation(LinearLayout.HORIZONTAL); bar.setBackgroundColor(Color.parseColor("#0F7A55"));
    bSo = tabBtn("Sổ"); bOtp = tabBtn("Check cước"); bTram = tabBtn("Mở Trạm");
    bar.addView(bSo, new LinearLayout.LayoutParams(0, -2, 1f)); bar.addView(bOtp, new LinearLayout.LayoutParams(0, -2, 1f)); bar.addView(bTram, new LinearLayout.LayoutParams(0, -2, 1f));
    root.addView(bar, new LinearLayout.LayoutParams(-1, -2));
    setContentView(root);

    CookieManager cm = CookieManager.getInstance(); cm.setAcceptCookie(true); cm.setAcceptThirdPartyCookies(otp, true);

    so.loadUrl("file:///android_asset/index.html");
    otp.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return false; }
      @Override public void onPageFinished(WebView v, String url) {
        CookieManager.getInstance().flush();
        if (url != null && url.toLowerCase().contains("otpsms.pro/electric")) {
          otp.evaluateJavascript(coreJs, null);
          if (pending != null) { String[] p = pending; pending = null; runCheck(p[0], p[1]); }
          if (pendingSv) { pendingSv = false; otp.evaluateJavascript("Native.serversDone(JSON.stringify(SDSCore.servers()))", null); }
        } else if (pending != null && url != null && url.toLowerCase().contains("login")) {
          pending = null;
          toSo("__sdsDone", "{\"rows\":[],\"stop\":\"otpsms đang đòi đăng nhập. Bấm nút Check cước ở dưới, đăng nhập xong quay lại bấm Check cước.\"}");
        }
      }
    });
    otp.loadUrl(OTP_URL);

    bSo.setOnClickListener(v -> show(true));
    bOtp.setOnClickListener(v -> show(false));
    bTram.setOnClickListener(v -> { show(false); if (otp.getUrl() == null || !otp.getUrl().toLowerCase().contains("otpsms.pro/electric")) otp.loadUrl(OTP_URL); else injectTram(true); });
    show(true);
  }

  private String readAsset(String n) {
    try (InputStream in = getAssets().open(n)) { java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream(); byte[] buf = new byte[8192]; int k; while ((k = in.read(buf)) > 0) bo.write(buf, 0, k); return bo.toString("UTF-8"); } catch (Exception e) { return ""; }
  }

  private boolean onElectric() { String u = otp.getUrl(); return u != null && u.toLowerCase().contains("otpsms.pro/electric"); }

  private void toSo(String fn, String json) { so.post(() -> so.evaluateJavascript("window." + fn + "&&window." + fn + "(" + json + ")", null)); }

  private void runCheck(String codesJson, String server) {
    String js = coreJs + ";(async function(){try{var R=await SDSCore.run(" + codesJson + ",{server:" + org.json.JSONObject.quote(server) + ",fallback:true,onProgress:function(t){Native.progress(t)}});Native.done(JSON.stringify(R))}catch(e){Native.done(JSON.stringify({rows:[],stop:'Lỗi: '+e.message}))}})();";
    otp.evaluateJavascript(js, null);
  }

  private void sendTo(Intent i) {
    Intent z = new Intent(i); z.setPackage(ZALO);
    if (z.resolveActivity(getPackageManager()) != null) { try { startActivity(z); return; } catch (Exception e) { } }
    startActivity(Intent.createChooser(i, "Gửi qua"));
  }

  private void injectTram(boolean toggle) {
    String guard = toggle ? "" : "if(!document.getElementById('sds-tram'))";
    otp.evaluateJavascript(guard + "{" + tramJs + "}", null);
  }

  private Button tabBtn(String t) {
    Button b = new Button(this); b.setText(t); b.setAllCaps(false); b.setTextColor(Color.WHITE); b.setBackgroundColor(Color.TRANSPARENT); b.setGravity(Gravity.CENTER); return b;
  }

  private void show(boolean isSo) {
    so.setVisibility(isSo ? View.VISIBLE : View.GONE); otp.setVisibility(isSo ? View.GONE : View.VISIBLE);
    bSo.setAlpha(isSo ? 1f : .6f); bOtp.setAlpha(isSo ? .6f : 1f);
  }

  private WebView makeWeb() {
    WebView w = new WebView(this);
    WebSettings st = w.getSettings();
    st.setJavaScriptEnabled(true); st.setDomStorageEnabled(true); st.setDatabaseEnabled(true);
    st.setAllowFileAccess(true); st.setLoadWithOverviewMode(true); st.setUseWideViewPort(true);
    st.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    if (Build.VERSION.SDK_INT >= 33) st.setAlgorithmicDarkeningAllowed(false);
    w.addJavascriptInterface(new Bridge(), "Native");
    w.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
        if (fileCb != null) fileCb.onReceiveValue(null);
        fileCb = cb;
        Intent i = new Intent(Intent.ACTION_GET_CONTENT); i.addCategory(Intent.CATEGORY_OPENABLE); i.setType("*/*");
        try { startActivityForResult(Intent.createChooser(i, "Chọn file"), PICK); } catch (Exception e) { fileCb = null; return false; }
        return true;
      }
    });
    return w;
  }

  private void googleAuth() {
    AuthorizationRequest.Builder bd = AuthorizationRequest.builder().setRequestedScopes(Arrays.asList(
      new Scope("https://www.googleapis.com/auth/spreadsheets"),
      new Scope("https://www.googleapis.com/auth/drive.metadata.readonly"),
      new Scope("email")));
    String acct = getSharedPreferences("sds", MODE_PRIVATE).getString("gacct", null);
    if (acct != null) bd.setAccount(new android.accounts.Account(acct, "com.google"));
    AuthorizationRequest req = bd.build();
    Identity.getAuthorizationClient(this).authorize(req)
      .addOnSuccessListener(r -> {
        if (r.hasResolution()) {
          try { startIntentSenderForResult(r.getPendingIntent().getIntentSender(), AUTH, null, 0, 0, 0); }
          catch (Exception e) { authErr(e.getMessage()); }
        } else authOk(r);
      })
      .addOnFailureListener(e -> authErr(e.getMessage()));
  }
  private void authOk(AuthorizationResult r) {
    String t = r.getAccessToken();
    if (t == null) { authErr("Không nhận được quyền truy cập"); return; }
    toSo("__gAuth", "{\"token\":" + org.json.JSONObject.quote(t) + "}");
  }
  private void authErr(String m) { toSo("__gAuth", "{\"err\":" + org.json.JSONObject.quote(m == null ? "Lỗi đăng nhập Google" : m) + "}"); }

  @Override protected void onActivityResult(int req, int res, Intent data) {
    if (req == ACC) {
      String name = data == null ? null : data.getStringExtra(android.accounts.AccountManager.KEY_ACCOUNT_NAME);
      if (res != RESULT_OK || name == null) { authErr("Chưa chọn tài khoản Google"); return; }
      getSharedPreferences("sds", MODE_PRIVATE).edit().putString("gacct", name).apply();
      googleAuth();
      return;
    }
    if (req == AUTH) {
      try { authOk(Identity.getAuthorizationClient(this).getAuthorizationResultFromIntent(data)); }
      catch (Exception e) { authErr("Anh đã hủy hoặc Google từ chối: " + e.getMessage()); }
      return;
    }
    if (req == PICK && fileCb != null) {
      Uri[] r = null;
      if (res == RESULT_OK && data != null && data.getData() != null) r = new Uri[]{ data.getData() };
      fileCb.onReceiveValue(r); fileCb = null; return;
    }
    super.onActivityResult(req, res, data);
  }

  @Override public void onBackPressed() {
    WebView cur = so.getVisibility() == View.VISIBLE ? so : otp;
    if (cur == otp && otp.canGoBack()) { otp.goBack(); return; }
    if (cur == otp) { show(true); return; }
    super.onBackPressed();
  }

  class Bridge {
    @JavascriptInterface public void googleAuth() { runOnUiThread(() -> MainActivity.this.googleAuth()); }
    @JavascriptInterface public void googleAuthChoose() {
      runOnUiThread(() -> {
        try { startActivityForResult(android.accounts.AccountManager.newChooseAccountIntent(null, null, new String[]{"com.google"}, null, null, null, null), ACC); }
        catch (Exception e) { MainActivity.this.googleAuth(); }
      });
    }
    @JavascriptInterface public void googleLogout() { getSharedPreferences("sds", MODE_PRIVATE).edit().remove("gacct").apply(); }
    @JavascriptInterface public String googleAccount() { return getSharedPreferences("sds", MODE_PRIVATE).getString("gacct", ""); }
    @JavascriptInterface public void shareZalo(String text) {
      runOnUiThread(() -> {
        Intent i = new Intent(Intent.ACTION_SEND); i.setType("text/plain"); i.putExtra(Intent.EXTRA_TEXT, text);
        sendTo(i);
      });
    }
    @JavascriptInterface public void shareFile(String name, String b64, String mime) {
      try {
        byte[] d = Base64.decode(b64, Base64.DEFAULT);
        File dir = new File(getCacheDir(), "share"); dir.mkdirs();
        File f = new File(dir, name); try (FileOutputStream o = new FileOutputStream(f)) { o.write(d); }
        Uri u = androidx.core.content.FileProvider.getUriForFile(MainActivity.this, "vn.sodienson.files", f);
        Intent i = new Intent(Intent.ACTION_SEND); i.setType(mime); i.putExtra(Intent.EXTRA_STREAM, u); i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        runOnUiThread(() -> sendTo(i));
      } catch (Exception e) { runOnUiThread(() -> Toast.makeText(MainActivity.this, "Không gửi được: " + e.getMessage(), Toast.LENGTH_LONG).show()); }
    }
    @JavascriptInterface public void http(String id, String method, String url, String body, String token) {
      new Thread(() -> {
        int code = 0; String out = "";
        try {
          HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
          c.setRequestMethod(method); c.setConnectTimeout(20000); c.setReadTimeout(60000);
          if (token != null && !token.isEmpty()) c.setRequestProperty("Authorization", "Bearer " + token);
          if (body != null && !body.isEmpty()) {
            c.setDoOutput(true); c.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            try (OutputStream o = c.getOutputStream()) { o.write(body.getBytes("UTF-8")); }
          }
          code = c.getResponseCode();
          InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
          if (in != null) { java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream(); byte[] buf = new byte[8192]; int k; while ((k = in.read(buf)) > 0) bo.write(buf, 0, k); out = bo.toString("UTF-8"); in.close(); }
        } catch (Exception e) { code = 0; out = String.valueOf(e.getMessage()); }
        toSo("__gHttp", "{\"id\":" + org.json.JSONObject.quote(id) + ",\"status\":" + code + ",\"body\":" + org.json.JSONObject.quote(out) + "}");
      }).start();
    }
    @JavascriptInterface public void check(String codesJson, String server) {
      runOnUiThread(() -> {
        if (!onElectric()) {
          pending = new String[]{ codesJson, server };
          toSo("__sdsProgress", org.json.JSONObject.quote("Đang mở trang Điện otpsms…"));
          otp.loadUrl(OTP_URL);
          return;
        }
        runCheck(codesJson, server);
      });
    }
    @JavascriptInterface public void askServers() {
      runOnUiThread(() -> {
        if (!onElectric()) { pendingSv = true; otp.loadUrl(OTP_URL); return; }
        otp.evaluateJavascript(coreJs + ";Native.serversDone(JSON.stringify(SDSCore.servers()))", null);
      });
    }
    @JavascriptInterface public void progress(String t) { toSo("__sdsProgress", org.json.JSONObject.quote(t)); }
    @JavascriptInterface public void done(String json) { toSo("__sdsDone", json); }
    @JavascriptInterface public void serversDone(String json) { toSo("__sdsServers", json); }
    @JavascriptInterface public boolean isDark() {
      return (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
    }
    @JavascriptInterface public void copy(String text) {
      runOnUiThread(() -> {
        ClipboardManager c = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
        c.setPrimaryClip(ClipData.newPlainText("sds", text));
        Toast.makeText(MainActivity.this, "Đã copy", Toast.LENGTH_SHORT).show();
      });
    }
    @JavascriptInterface public void share(String text) {
      runOnUiThread(() -> {
        Intent i = new Intent(Intent.ACTION_SEND); i.setType("text/plain"); i.putExtra(Intent.EXTRA_TEXT, text);
        startActivity(Intent.createChooser(i, "Gửi qua"));
      });
    }
    @JavascriptInterface public String saveFile(String name, String b64, String mime) {
      try {
        byte[] data = Base64.decode(b64, Base64.DEFAULT);
        Uri uri;
        if (Build.VERSION.SDK_INT >= 29) {
          ContentValues cv = new ContentValues();
          cv.put(MediaStore.Downloads.DISPLAY_NAME, name); cv.put(MediaStore.Downloads.MIME_TYPE, mime);
          cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/SoDienSon");
          uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
          try (OutputStream o = getContentResolver().openOutputStream(uri)) { o.write(data); }
        } else {
          File dir = new File(getExternalFilesDir(null), "SoDienSon"); dir.mkdirs();
          File f = new File(dir, name); try (FileOutputStream o = new FileOutputStream(f)) { o.write(data); }
          uri = Uri.fromFile(f);
        }
        runOnUiThread(() -> Toast.makeText(MainActivity.this, "Đã lưu " + name + " vào Download/SoDienSon", Toast.LENGTH_LONG).show());
        return "ok";
      } catch (Exception e) {
        runOnUiThread(() -> Toast.makeText(MainActivity.this, "Không lưu được: " + e.getMessage(), Toast.LENGTH_LONG).show());
        return "err";
      }
    }
  }

}
