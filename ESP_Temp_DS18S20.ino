/*
websocket Client für den ESP8266 zum Messen der Temperatur mit einem DS18x20
*/
#include <ESP8266WiFi.h>
#include <WebSocketClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

extern "C" {
  #include "user_interface.h"
}
 
const char* ssid = "FRITZ!Box 7490";
const char* password = "xxx";
char wiFiHostname[ ] = "Kinderzimmer";
char path[] = "/";
char host[] = "echo.websocket.org";
int i = 0;

#define ONE_WIRE_BUS D4
// oneWire Bus initialisieren
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

 
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
  if (client.connect("minibian", 1337)) {
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
    webSocketClient.sendData(WiFi.hostname());
  } else {
    Serial.println("Handshake failed.");
    while (1) {
      // Hang on failure
    }
  }
  sensors.begin();
}
 
void loop() {
  String data;
  float temperature = 0;
  int humidity = -1;

  sensors.requestTemperatures();
  temperature = sensors.getTempCByIndex(0);
  Serial.println("Sample OK: ");
  Serial.println(temperature); Serial.print(" *C, "); 
  //Reste der DHT11-Implementierung
  Serial.println((int)-1); Serial.println(" %");

  if (client.connected()) {
    webSocketClient.getData(data);
    if (data.length() > 0) {
      Serial.print("Received data: ");
      Serial.println(data);
    }
    // capture the value of analog 1, send it along
    //pinMode(1, INPUT);
    data = "{\"type\":\"SensorTherm\",\"data\":{\"time\":\"2017-01-02T21:22:18.676Z\",\"sensor\":\""+WiFi.hostname()+"\",\"temp\":"+temperature+",\"humidity\":"+humidity+"}}";
    Serial.println(data);
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
 
