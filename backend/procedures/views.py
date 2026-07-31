from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Procedure
from .permissions import CanViewProcedure


@api_view(["GET"])
@permission_classes([
    IsAuthenticated,
    CanViewProcedure,
])
def procedure_list(request):
    procedures = Procedure.objects.all()

    data = []

    for procedure in procedures:
        data.append({
            "id": procedure.id,
            "title": procedure.title,
        })

    return Response(data)