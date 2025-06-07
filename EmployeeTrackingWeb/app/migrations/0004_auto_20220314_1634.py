
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_attendancelogs_groupchat_leaves_organizationnews_workproductivitydataset'),
    ]

    operations = [
        migrations.AlterField(
            model_name='groupchat',
            name='user',
            field=models.CharField(max_length=250),
        ),
    ]
