from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rwanda_locations import get_provinces, get_districts, get_sectors, get_cells


def locations_api(request):
    province = request.GET.get("province")
    district = request.GET.get("district")
    sector   = request.GET.get("sector")
    if sector and province and district:
        return JsonResponse({"cells": get_cells(province, district, sector)})
    elif district and province:
        return JsonResponse({"sectors": get_sectors(province, district)})
    elif province:
        return JsonResponse({"districts": get_districts(province)})
    else:
        return JsonResponse({"provinces": get_provinces()})


urlpatterns = [
    path("admin/",               admin.site.urls),
    path("api/auth/",            include("users.urls")),
    path("api/meters/",          include("meters.urls")),
    path("api/transactions/",    include("transactions.urls")),
    path("api/notifications/",   include("notifications.urls")),
    path("api/support/",         include("support.urls")),
    path("api/locations/",       locations_api),
    path("api/admin-panel/",     include("meters.admin_urls")),
    path("api/meter-requests/",  include("meters.meter_request_urls")),

    path("api/schema/", SpectacularAPIView.as_view(),                      name="schema"),
    path("api/docs/",   SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)