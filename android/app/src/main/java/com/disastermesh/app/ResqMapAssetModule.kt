package com.disastermesh.app

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.InputStream

class ResqMapAssetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ResqMapAssetModule"

    @ReactMethod
    fun loadAsset(assetPath: String, promise: Promise) {
        try {
            val inputStream: InputStream = reactContext.assets.open(assetPath)
            val text = inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
            promise.resolve(text)
        } catch (e: Exception) {
            promise.reject("ASSET_READ_ERROR", "Failed to load asset '$assetPath': ${e.message}", e)
        }
    }
}
