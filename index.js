var WebView = Packages.android.webkit.WebView;
var JsUrl = Packages.com.rbowman.scriptit.lang.JsUrl;

function onCreate(bundle)
{
    var webView = new WebView(Activity);
    
    loadHtmlWrapper(webView);
    
    Activity.setContentView(webView);
    Activity.setTitle("AirSim");
}

function loadHtmlWrapper(webView)
{
    webView.getSettings().setJavaScriptEnabled(true);
    webView.clearCache(true);
    /*
    var client = new JavaAdapter(WebViewClient, {
        shouldInterceptRequest: function() {}
    });
    webView.setWebViewClient(client);
    */
    var url = "file:///" + JsUrl.toPath("scriptit://ProjectSim/index.htm");
    webView.loadUrl(url);
}

