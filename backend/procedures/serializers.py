from rest_framework import serializers

from .models import Procedure


class ProcedureSerializer(serializers.ModelSerializer):

    class Meta:
        model = Procedure

        fields = [
            "id",
            "title",
            "description",
            "created_by",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "updated_at",
        ]