from django.urls import path
from . import views

urlpatterns = [
    path("", views.tasks_list, name="tasks-list"),
    path("<int:task_id>/", views.task_detail, name="tasks-list"),
    path("<int:task_id>/assignment/", views.task_assignment, name="task-assignment"),
    path("executions/<int:execution_id>/",views.execution_detail,name="execution-detail"),
    path("executions/<int:execution_id>/cancel/", views.execution_cancel, name="execution-cancelled"),
]
