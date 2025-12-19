from fastapi.testclient import TestClient
from urllib.parse import quote
from src import app as app_module

client = TestClient(app_module.app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Art Club" in data


def test_signup_and_unsubscribe_flow():
    activity = "Art Club"
    email = "testuser@example.com"

    signup_path = f"/activities/{quote(activity)}/signup?email={quote(email)}"
    res = client.post(signup_path)
    assert res.status_code == 200
    j = res.json()
    assert "Signed up" in j["message"]
    assert j["participants_count"] >= 1

    # Ensure participant present
    res2 = client.get("/activities")
    assert res2.status_code == 200
    data = res2.json()
    assert email in data[activity]["participants"]

    # Duplicate signup should fail
    res_dup = client.post(signup_path)
    assert res_dup.status_code == 400

    # Unregister
    del_path = f"/activities/{quote(activity)}/participants?email={quote(email)}"
    res_del = client.delete(del_path)
    assert res_del.status_code == 200
    jd = res_del.json()
    assert "Unregistered" in jd["message"]

    # Ensure removed
    res3 = client.get("/activities")
    data2 = res3.json()
    assert email not in data2[activity]["participants"]


def test_unsubscribe_nonexistent():
    activity = "Art Club"
    email = "nonexistent@example.com"
    del_path = f"/activities/{quote(activity)}/participants?email={quote(email)}"
    res = client.delete(del_path)
    assert res.status_code == 404
