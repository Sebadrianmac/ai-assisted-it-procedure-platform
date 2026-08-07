from django.urls import path
from . import views
from . import role_views
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
urlpatterns = [
    path('login/', views.login_view, name="login"),
    path('me/', views.me_view, name='me'),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",

    ),
    path("users/", views.users_list, name="list-users"),
    path("users/<int:user_id>/", views.user_details, name="user-delete"),
    path("roles/", role_views.roles_list, name="roles-list"),
    path("roles/<int:role_id>/", role_views.role_details, name="role_detail"),

]
