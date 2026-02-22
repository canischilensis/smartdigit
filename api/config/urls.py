from django.urls import path, include
from django.http import HttpResponse
from django.shortcuts import render

def home(request):
    return render(request, "index.html")   # tu frontend

def health(request):
    return HttpResponse("SmartDigit API OK")

urlpatterns = [
    path("", home),
    path("health/", health),
    path("api/v1/", include("inference.urls")),
]