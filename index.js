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
    
    webView.loadUrl("file://" + 
        JsUrl.toPath("scriptit://ProjectSim/index.htm"));
}

