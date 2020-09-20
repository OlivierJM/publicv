require 'test_helper'

class SearchesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    sign_in(@user)
  end

  test 'GET #index returns a success response' do
    post searches_path
    assert_response :success
  end
end
