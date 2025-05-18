INSERT INTO hyrex_app (
    id,
    app_info
) VALUES (
    :appId,
    :appInfo
)
ON CONFLICT (id) DO UPDATE SET
    app_info = :appInfo;
