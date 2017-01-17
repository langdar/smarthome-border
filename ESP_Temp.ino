#include <ESP8266WiFi.h>
#include <WebSocketClient.h>
extern "C" {
  #include "user_interface.h"
}
 
const char* ssid = "FRITZ!Box 7490";
const char* password = "StarTrek'07052004";
char wiFiHostname[ ] = "ESPBalkon";
char path[] = "/";
char host[] = "echo.websocket.org";
int i = 0;
 
WebSocketClient webSocketClient;
 
// Use WiFiClient class to create TCP connections
WiFiClient client;
 
void setup() {
  Serial.begin(115200);
  delay(10);
  // Connect to WiFi network
  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
 
  WiFi.begin(ssid, password);
  wifi_station_set_auto_connect(true);
  wifi_station_set_hostname(wiFiHostname);
 
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  WiFi.printDiag(Serial);
  Serial.println(WiFi.hostname());
 
  // Connect to the websocket server
  if (client.connect("echo.websocket.org", 80)) {
    Serial.println("Connected");
  } else {
    Serial.println("Connection failed.");
    while (1) {
      // Hang on failure
    }
  }
 
  // Handshake with the server
  webSocketClient.path = path;
  webSocketClient.host = host;
  if (webSocketClient.handshake(client)) {
    Serial.println("Handshake successful");
  } else {
    Serial.println("Handshake failed.");
    while (1) {
      // Hang on failure
    }
  }
}
 
void loop() {
  String data;
 
  if (client.connected()) {
    webSocketClient.getData(data);
    if (data.length() > 0) {
      Serial.print("Received data: ");
      Serial.println(data);
    }
    // capture the value of analog 1, send it along
    //pinMode(1, INPUT);
    data = String(i);
    webSocketClient.sendData(data);
  } else {
    Serial.println("Client disconnected.");
    while (1) {
      // Hang on disconnect.
    }
  }
  // wait to fully let the client disconnect
  i ++;
  delay(3000);
}
